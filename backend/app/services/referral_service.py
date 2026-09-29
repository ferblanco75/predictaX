import secrets
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.email_canonical import canonical_email
from app.models.prediction import Prediction
from app.models.referral import Referral
from app.models.user import User

REFERRED_BONUS = 100.0
REFERRER_BONUS = 200.0
# #280: how long a code recorded at registration stays claimable. The real
# signup verifies minutes later; a claim long after is far more likely to be
# the owner taking back an address someone else pre-registered under their own
# code, and that attribution must not survive.
PENDING_REFERRAL_TTL_HOURS = 24

# #282: farming was unbounded — N throwaway accounts paid the referrer N * 200
# points. The caps below are sized so that inviting real friends never meets
# them: ten a day covers any plausible burst of invitations, fifty lifetime is
# far past what an MVP user base refers organically, and three per IP still
# lets a household or an office share one connection.
MAX_REFERRALS_PER_DAY = 10
MAX_REFERRALS_TOTAL = 50
MAX_REFERRALS_PER_IP = 3
REFERRAL_DAY_WINDOW_HOURS = 24

# #282: the bonus used to vest on a single 1-point bet. The referred account
# has to look like a real player first — a few bets, a stake worth something,
# and an account that survived its first day.
MIN_REFERRED_PREDICTIONS = 3
MIN_REFERRED_WAGERED = 150.0
MIN_REFERRED_ACCOUNT_AGE_HOURS = 24

BLOCK_TOTAL_CAP = "total_cap"
BLOCK_DAILY_CAP = "daily_cap"
BLOCK_IP_CAP = "ip_cap"


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


def _is_same_person(db: Session, referrer: User, user: User) -> bool:
    """True when the referred address is an alias of an inbox already in play.

    #282: `attacker+1@gmail.com` is the same mailbox as `attacker@gmail.com`,
    so referring one from the other is direct self-referral wearing a hat. The
    same goes for referring two aliases of one inbox: only the first counts.
    """
    target = canonical_email(user.email)
    if canonical_email(referrer.email) == target:
        return True

    peers = (
        db.query(User.email)
        .join(Referral, Referral.referred_id == User.id)
        .filter(Referral.referrer_id == referrer.id, Referral.referred_id != user.id)
        .all()
    )
    return any(canonical_email(email) == target for (email,) in peers)


def _block_reason(
    db: Session, referrer: User, signup_ip: str | None, exclude_id=None
) -> str | None:
    """Which cap, if any, currently withholds the bonuses for this referrer.

    Counts attributed referrals rather than paid bonuses, so a referrer cannot
    park blocked rows to make room under the cap later.
    """
    others = db.query(func.count(Referral.id)).filter(Referral.referrer_id == referrer.id)
    if exclude_id is not None:
        others = others.filter(Referral.id != exclude_id)

    if (others.scalar() or 0) >= MAX_REFERRALS_TOTAL:
        return BLOCK_TOTAL_CAP

    since = datetime.now(timezone.utc) - timedelta(hours=REFERRAL_DAY_WINDOW_HOURS)
    if (others.filter(Referral.created_at >= since).scalar() or 0) >= MAX_REFERRALS_PER_DAY:
        return BLOCK_DAILY_CAP

    if signup_ip:
        same_ip = others.filter(Referral.signup_ip == signup_ip).scalar() or 0
        if same_ip >= MAX_REFERRALS_PER_IP:
            return BLOCK_IP_CAP

    return None


def _referred_is_active(db: Session, user: User) -> bool:
    """Whether the referred account has done enough to vest the bonus (#282)."""
    if user.created_at is not None:
        age = datetime.now(timezone.utc) - user.created_at
        if age < timedelta(hours=MIN_REFERRED_ACCOUNT_AGE_HOURS):
            return False

    count, wagered = (
        db.query(
            func.count(Prediction.id),
            func.coalesce(func.sum(Prediction.points_wagered), 0.0),
        )
        .filter(Prediction.user_id == user.id)
        .one()
    )
    return count >= MIN_REFERRED_PREDICTIONS and float(wagered) >= MIN_REFERRED_WAGERED


def claim_pending_referral(db: Session, user: User, signup_ip: str | None = None) -> None:
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

    # An alias of an inbox the referrer already controls earns no attribution
    # at all (#282) — this is self-referral, not a capped bonus.
    if _is_same_person(db, referrer, user):
        db.commit()
        return

    signup_ip = (signup_ip or "")[:45] or None
    blocked = _block_reason(db, referrer, signup_ip)
    referral = Referral(
        referrer_id=referrer.id,
        referred_id=user.id,
        referral_code=code,
        signup_ip=signup_ip,
        bonus_blocked_reason=blocked,
        referred_bonus_awarded=blocked is None,
        referrer_bonus_awarded=False,
    )
    if blocked is None:
        user.points += REFERRED_BONUS
    db.add(referral)
    db.commit()


def _vest(db: Session, referral: Referral, referrer: User, referred: User) -> None:
    """Pay out a referral whose referred account has earned it (#282)."""
    if not _referred_is_active(db, referred):
        return

    blocked = _block_reason(db, referrer, referral.signup_ip, exclude_id=referral.id)
    if blocked is not None:
        if referral.bonus_blocked_reason != blocked:
            referral.bonus_blocked_reason = blocked
            db.commit()
        return

    referrer.points += REFERRER_BONUS
    referral.referrer_bonus_awarded = True
    # A referred bonus withheld at signup by a cap that has since cleared is
    # paid here, so a legitimate referral never loses half its value.
    if not referral.referred_bonus_awarded:
        referred.points += REFERRED_BONUS
        referral.referred_bonus_awarded = True
    referral.bonus_blocked_reason = None
    db.commit()


def award_referrer_bonus_if_eligible(db: Session, user: User) -> None:
    """Try to vest the referral that brought `user` in.

    Called after every prediction: since #282 the thresholds need more than
    the first bet, so no single prediction is "the" trigger.
    """
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

    _vest(db, referral, referrer, user)


def _vest_pending_referrals(db: Session, referrer: User) -> None:
    """Re-check the referrer's unvested referrals.

    The prediction path only fires while the referred user is still betting,
    so someone who placed their bets on day one and stopped would never clear
    the account-age gate. Opening the referral page sweeps them instead.
    """
    pending = (
        db.query(Referral)
        .filter(Referral.referrer_id == referrer.id, Referral.referrer_bonus_awarded.is_(False))
        .all()
    )
    for referral in pending:
        referred = db.query(User).filter(User.id == referral.referred_id).first()
        if referred:
            _vest(db, referral, referrer, referred)


def get_referral_stats(db: Session, user: User) -> dict:
    ensure_user_has_code(db, user)
    _vest_pending_referrals(db, user)
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
