import secrets
import string

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.referral import Referral
from app.models.user import User

REFERRED_BONUS = 100.0
REFERRER_BONUS = 200.0


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


def process_referral_on_register(db: Session, new_user: User, referral_code: str) -> None:
    referrer = db.query(User).filter(User.referral_code == referral_code).first()
    if not referrer or referrer.id == new_user.id:
        return

    already = db.query(Referral).filter(Referral.referred_id == new_user.id).first()
    if already:
        return

    referral = Referral(
        referrer_id=referrer.id,
        referred_id=new_user.id,
        referral_code=referral_code,
        referred_bonus_awarded=True,
        referrer_bonus_awarded=False,
    )
    new_user.points += REFERRED_BONUS
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
    referred_count = db.query(func.count(Referral.id)).filter(Referral.referrer_id == user.id).scalar() or 0
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