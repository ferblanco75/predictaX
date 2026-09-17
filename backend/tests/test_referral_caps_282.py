"""#282: referral bonuses are capped, alias-aware and gated on real activity."""

from datetime import datetime, timedelta, timezone

import pytest

from app.core.email_canonical import canonical_email
from app.models.prediction import Prediction
from app.models.referral import Referral
from app.models.user import User
from app.services import referral_service

AGED = datetime.now(timezone.utc) - timedelta(hours=48)


def _make_user(db, email: str, username: str, *, code: str | None = None) -> User:
    user = User(
        email=email,
        username=username,
        hashed_password="",
        email_verified=True,
        points=1000.0,
        referral_code=code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _claim(db, referrer: User, referred: User, signup_ip: str | None = None) -> Referral | None:
    """Run the verify_otp-time claim and return the row it produced, if any."""
    referred.pending_referral_code = referrer.referral_code
    db.commit()
    referral_service.claim_pending_referral(db, referred, signup_ip=signup_ip)
    db.refresh(referred)
    return db.query(Referral).filter(Referral.referred_id == referred.id).first()


def _bet(db, user: User, market, amount: float) -> None:
    db.add(
        Prediction(
            user_id=user.id,
            market_id=market.id,
            probability=55.0,
            points_wagered=amount,
        )
    )
    db.commit()


def _age_account(db, user: User) -> None:
    """Push the account past MIN_REFERRED_ACCOUNT_AGE_HOURS."""
    user.created_at = AGED
    db.commit()


# --- email canonicalisation -------------------------------------------------


@pytest.mark.parametrize(
    "address,expected",
    [
        ("farmer+1@gmail.com", "farmer@gmail.com"),
        ("f.a.r.m.e.r@gmail.com", "farmer@gmail.com"),
        ("Farmer+99@GoogleMail.com", "farmer@gmail.com"),
        ("farmer+1@hotmail.com.ar", "farmer@hotmail.com.ar"),
        # Outlook keeps dots significant, unlike Gmail.
        ("far.mer@outlook.com", "far.mer@outlook.com"),
        # Unknown domains are left exactly as typed — `+` may well be part of
        # a real, separate mailbox there.
        ("farmer+1@example.com", "farmer+1@example.com"),
        ("far.mer@example.com", "far.mer@example.com"),
    ],
)
def test_canonical_email(address, expected):
    assert canonical_email(address) == expected


# --- alias farming ----------------------------------------------------------


def test_gmail_alias_of_the_referrer_earns_no_referral(db):
    referrer = _make_user(db, "farmer@gmail.com", "farmer", code="NEURO-AAAAAA")
    referred = _make_user(db, "farmer+1@gmail.com", "farmeralias")

    assert _claim(db, referrer, referred) is None
    assert referred.points == 1000.0
    assert referrer.points == 1000.0


def test_gmail_dot_variant_of_the_referrer_earns_no_referral(db):
    referrer = _make_user(db, "farmer@gmail.com", "farmer", code="NEURO-AAAAAB")
    referred = _make_user(db, "f.ar.mer@gmail.com", "farmerdots")

    assert _claim(db, referrer, referred) is None
    assert referred.points == 1000.0


def test_alias_on_a_domain_without_plus_aliasing_is_a_real_referral(db):
    """example.com may route `+` to a different person, so don't merge them."""
    referrer = _make_user(db, "farmer@example.com", "exfarmer", code="NEURO-AAAAAC")
    referred = _make_user(db, "farmer+1@example.com", "exfarmeralias")

    referral = _claim(db, referrer, referred)
    assert referral is not None
    assert referral.bonus_blocked_reason is None
    assert referred.points == 1100.0


def test_two_aliases_of_one_inbox_are_only_referred_once(db):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-AAAAAD")
    first = _make_user(db, "target@gmail.com", "targetone")
    second = _make_user(db, "t.arget+promo@gmail.com", "targettwo")

    assert _claim(db, referrer, first) is not None
    assert _claim(db, referrer, second) is None
    assert second.points == 1000.0


# --- caps -------------------------------------------------------------------


def test_bonuses_stop_accruing_past_the_daily_cap(db):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-BBBBBB")

    for i in range(referral_service.MAX_REFERRALS_PER_DAY):
        referred = _make_user(db, f"friend{i}@example.com", f"friend{i}")
        referral = _claim(db, referrer, referred)
        assert referral.bonus_blocked_reason is None
        assert referred.points == 1100.0

    over = _make_user(db, "onetoomany@example.com", "onetoomany")
    referral = _claim(db, referrer, over)

    assert referral.bonus_blocked_reason == referral_service.BLOCK_DAILY_CAP
    assert referral.referred_bonus_awarded is False
    assert over.points == 1000.0


def test_daily_capped_referral_never_pays_the_referrer_either(db, sample_market):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-BBBBBC")
    for i in range(referral_service.MAX_REFERRALS_PER_DAY):
        _claim(db, referrer, _make_user(db, f"friend{i}@example.com", f"friend{i}"))

    over = _make_user(db, "onetoomany@example.com", "onetoomany")
    _claim(db, referrer, over)
    _age_account(db, over)
    for _ in range(referral_service.MIN_REFERRED_PREDICTIONS):
        _bet(db, over, sample_market, referral_service.MIN_REFERRED_WAGERED)

    referral_service.award_referrer_bonus_if_eligible(db, over)
    db.refresh(referrer)

    assert referrer.points == 1000.0


def test_bonuses_stop_accruing_past_the_lifetime_cap(db):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-CCCCCC")

    # Backdated so the daily window is clear and only the lifetime cap applies.
    old = datetime.now(timezone.utc) - timedelta(days=30)
    for i in range(referral_service.MAX_REFERRALS_TOTAL):
        past = _make_user(db, f"old{i}@example.com", f"old{i}")
        db.add(
            Referral(
                referrer_id=referrer.id,
                referred_id=past.id,
                referral_code=referrer.referral_code,
                referred_bonus_awarded=True,
                referrer_bonus_awarded=True,
                created_at=old,
            )
        )
    db.commit()

    over = _make_user(db, "onetoomany@example.com", "onetoomany")
    referral = _claim(db, referrer, over)

    assert referral.bonus_blocked_reason == referral_service.BLOCK_TOTAL_CAP
    assert over.points == 1000.0


def test_signups_from_one_ip_are_capped(db):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-DDDDDD")

    for i in range(referral_service.MAX_REFERRALS_PER_IP):
        referred = _make_user(db, f"room{i}@example.com", f"room{i}")
        assert _claim(db, referrer, referred, signup_ip="203.0.113.7").bonus_blocked_reason is None

    over = _make_user(db, "room9@example.com", "room9")
    referral = _claim(db, referrer, over, signup_ip="203.0.113.7")
    assert referral.bonus_blocked_reason == referral_service.BLOCK_IP_CAP

    # A different connection is unaffected.
    elsewhere = _make_user(db, "elsewhere@example.com", "elsewhere")
    other = _claim(db, referrer, elsewhere, signup_ip="198.51.100.4")
    assert other.bonus_blocked_reason is None


# --- activity threshold -----------------------------------------------------


def test_a_single_minimum_bet_does_not_vest_the_bonus(db, sample_market):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-EEEEEE")
    referred = _make_user(db, "friend@example.com", "friend")
    _claim(db, referrer, referred)
    _age_account(db, referred)

    _bet(db, referred, sample_market, 1.0)
    referral_service.award_referrer_bonus_if_eligible(db, referred)
    db.refresh(referrer)

    assert referrer.points == 1000.0


def test_enough_bets_but_too_little_staked_does_not_vest(db, sample_market):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-EEEEEF")
    referred = _make_user(db, "friend@example.com", "friend")
    _claim(db, referrer, referred)
    _age_account(db, referred)

    for _ in range(referral_service.MIN_REFERRED_PREDICTIONS):
        _bet(db, referred, sample_market, 1.0)
    referral_service.award_referrer_bonus_if_eligible(db, referred)
    db.refresh(referrer)

    assert referrer.points == 1000.0


def test_a_fresh_account_does_not_vest_however_much_it_bets(db, sample_market):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-EEEEEG")
    referred = _make_user(db, "friend@example.com", "friend")
    _claim(db, referrer, referred)

    for _ in range(referral_service.MIN_REFERRED_PREDICTIONS):
        _bet(db, referred, sample_market, referral_service.MIN_REFERRED_WAGERED)
    referral_service.award_referrer_bonus_if_eligible(db, referred)
    db.refresh(referrer)

    assert referrer.points == 1000.0


def test_real_activity_on_an_aged_account_vests_the_bonus(db, sample_market):
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-FFFFFF")
    referred = _make_user(db, "friend@example.com", "friend")
    _claim(db, referrer, referred)
    _age_account(db, referred)

    for _ in range(referral_service.MIN_REFERRED_PREDICTIONS):
        _bet(db, referred, sample_market, referral_service.MIN_REFERRED_WAGERED / 2)
    referral_service.award_referrer_bonus_if_eligible(db, referred)
    db.refresh(referrer)

    assert referrer.points == 1000.0 + referral_service.REFERRER_BONUS


def test_referral_page_vests_a_referral_the_prediction_path_missed(db, sample_market):
    """Bets placed on day one leave nothing to trigger the age gate later."""
    referrer = _make_user(db, "host@example.com", "host", code="NEURO-GGGGGG")
    referred = _make_user(db, "friend@example.com", "friend")
    _claim(db, referrer, referred)

    for _ in range(referral_service.MIN_REFERRED_PREDICTIONS):
        _bet(db, referred, sample_market, referral_service.MIN_REFERRED_WAGERED)
    referral_service.award_referrer_bonus_if_eligible(db, referred)
    db.refresh(referrer)
    assert referrer.points == 1000.0

    _age_account(db, referred)
    stats = referral_service.get_referral_stats(db, referrer)

    assert stats["points_earned"] == referral_service.REFERRER_BONUS
    assert referrer.points == 1000.0 + referral_service.REFERRER_BONUS
