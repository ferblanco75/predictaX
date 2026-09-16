import secrets
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.referral import Referral
from app.models.user import User

REFERRED_BONUS = 100.0
REFERRER_BONUS = 200.0
# #280: how long a code recorded at registration stays claimable. The real
# signup verifies minutes later; a claim long after is far more likely to be
# the owner taking back an address someone else pre-registered under their own
# code, and that attribution must not survive.
PENDING_REFERRAL_TTL_HOURS = 24


def generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "NEURO-" + "".join(secrets.choice(chars) for _ in range(6))


def ensure_user_has_code(db: Session, user: User) -> str:
    if user.referral_code:
        return user.referral_code

    for _ in range(10):
        code = generate_code()
        if not db.query(User).filter(User.referral_code == code).first():
            user.referral_code = code
            db.commit()
            db.refresh(user)
            return code
    raise RuntimeError("Could not generate unique referral code")


def claim_pending_referral(db: Session, user: User) -> None:
    """Turn the code recorded at registration into a real Referral row.

    #280: the row used to be created by /register, so pre-registering someone
    else's email under your own code was enough to earn the referrer bonus on
    an address you never controlled. It is created here instead, once the
    account has passed verify_otp — and only while the pending code is still
    fresh, so a long-delayed claim by the real owner drops the attribution.
    """
    code = user.pending_referral_code
    if not code:
        return

    user.pending_referral_code = None
    referrer = db.query(User).filter(User.referral_code == code).first()
    already = db.query(Referral).filter(Referral.referred_id == user.id).first()
    ttl = timedelta(hours=PENDING_REFERRAL_TTL_HOURS)
    expired = user.created_at is not None and datetime.now(timezone.utc) - user.created_at > ttl

    if expired or already or not referrer or referrer.id == user.id:
        db.commit()
        return

    referral = Referral(
        referrer_id=referrer.id,
        referred_id=user.id,
        referral_code=code,
        referred_bonus_awarded=True,
        referrer_bonus_awarded=False,
    )
    user.points += REFERRED_BONUS
    db.add(referral)
    db.commit()


def award_referrer_bonus_if_eligible(db: Session, user: User) -> None:
    referral = (
        db.query(Referral)
        .filter(Referral.referred_id == user.id, Referral.referrer_bonus_awarded.is_(False))
        .first()
    )
    if not referral:
        return

    referrer = db.query(User).filter(User.id == referral.referrer_id).first()
    if not referrer:
        return

    referrer.points += REFERRER_BONUS
    referral.referrer_bonus_awarded = True
    db.commit()


def get_referral_stats(db: Session, user: User) -> dict:
    ensure_user_has_code(db, user)
    referred_count = (
        db.query(func.count(Referral.id)).filter(Referral.referrer_id == user.id).scalar() or 0
    )
    points_earned = (
        db.query(func.count(Referral.id))
        .filter(Referral.referrer_id == user.id, Referral.referrer_bonus_awarded.is_(True))
        .scalar() or 0
    ) * REFERRER_BONUS

    return {
        "referral_code": user.referral_code,
        "referred_count": referred_count,
        "points_earned": points_earned,
    }