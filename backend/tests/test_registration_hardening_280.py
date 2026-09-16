"""Regression tests for #280: /register marked unproven emails as verified.

Registration proves nothing about who controls the inbox, so nothing it stamps
can be trusted until verify_otp — not email_verified, not the consent record,
not the marketing opt-in, and not referral attribution.
"""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models.referral import Referral
from app.models.user import User
from app.services import otp_service

REGISTER_URL = "/api/auth/register"
REFERRAL_URL = "/api/users/me/referral"

VICTIM_EMAIL = "victim-280@predictax.com"

ATTACKER_DATA = {
    "email": "attacker-280@predictax.com",
    "username": "attacker280",
    "password": "attackerpass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}


def _register(client: TestClient, email: str, username: str, **extra):
    return client.post(
        REGISTER_URL,
        json={
            "email": email,
            "username": username,
            "terms_accepted": True,
            "privacy_accepted": True,
            "is_adult": True,
            **extra,
        },
    )


def _claim_via_otp(client: TestClient, db, monkeypatch, email: str):
    """Complete the OTP flow as the real owner of the address."""
    monkeypatch.setattr(otp_service, "_send_otp_email", lambda email, code: True)
    client.post("/api/auth/otp/request", json={"email": email})
    otp = (
        db.query(otp_service.OTPCode)
        .filter(otp_service.OTPCode.email == email)
        .order_by(otp_service.OTPCode.created_at.desc())
        .first()
    )
    return client.post("/api/auth/otp/verify", json={"email": email, "code": otp.code})


def test_passwordless_registration_is_not_email_verified(client: TestClient, db):
    """The frontend never sends a password, so this was the normal path to a
    "verified" account nobody had ever proven control of."""
    response = _register(client, VICTIM_EMAIL, "victim280")
    assert response.status_code == 201

    user = db.query(User).filter(User.email == VICTIM_EMAIL).first()
    assert user.email_verified is False


def test_owner_otp_claim_resets_attacker_set_attributes(client: TestClient, db, monkeypatch):
    """The real owner completing OTP on a pre-created account must not inherit
    the registrant's forged consent or marketing opt-in."""
    _register(
        client,
        VICTIM_EMAIL,
        "victim280",
        password="attackerpass123",
        marketing_opt_in=True,
    )

    user = db.query(User).filter(User.email == VICTIM_EMAIL).first()
    forged_consent_at = user.terms_accepted_at
    assert user.marketing_opt_in is True

    assert _claim_via_otp(client, db, monkeypatch, VICTIM_EMAIL).status_code == 200

    db.refresh(user)
    assert user.email_verified is True
    assert user.hashed_password == ""
    assert user.marketing_opt_in is False
    assert user.marketing_opt_in_at is None
    # Consent is re-recorded as of the first sign-in that proves inbox control.
    assert user.terms_accepted_at > forged_consent_at
    assert user.privacy_accepted_at > forged_consent_at
    assert user.age_confirmed_at > forged_consent_at


def test_no_referral_row_until_referred_account_is_verified(client: TestClient, db, monkeypatch):
    """Pre-registering someone else's email under your own code must not earn
    attribution on its own."""
    _register(client, ATTACKER_DATA["email"], ATTACKER_DATA["username"],
              password=ATTACKER_DATA["password"])
    attacker = db.query(User).filter(User.email == ATTACKER_DATA["email"]).first()
    attacker.email_verified = True
    db.commit()
    login = client.post(
        "/api/auth/login",
        json={"email": ATTACKER_DATA["email"], "password": ATTACKER_DATA["password"]},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    code = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]

    assert _register(client, VICTIM_EMAIL, "victim280", referral_code=code).status_code == 201

    victim = db.query(User).filter(User.email == VICTIM_EMAIL).first()
    assert victim.pending_referral_code == code
    assert db.query(Referral).filter(Referral.referred_id == victim.id).first() is None
    assert victim.points == 1000.0

    # ...and it does exist once the referred account is verified.
    assert _claim_via_otp(client, db, monkeypatch, VICTIM_EMAIL).status_code == 200
    db.refresh(victim)
    referral = db.query(Referral).filter(Referral.referred_id == victim.id).first()
    assert referral is not None
    assert referral.referrer_id == attacker.id
    assert victim.points == 1100.0


def test_stale_pending_referral_is_dropped_on_claim(client: TestClient, db, monkeypatch):
    """A claim long after the registration is the owner taking the address
    back, not the referred user finishing signup — attribution is dropped."""
    _register(client, ATTACKER_DATA["email"], ATTACKER_DATA["username"],
              password=ATTACKER_DATA["password"])
    attacker = db.query(User).filter(User.email == ATTACKER_DATA["email"]).first()
    attacker.referral_code = "NEURO-STALE1"
    db.commit()

    _register(client, VICTIM_EMAIL, "victim280", referral_code="NEURO-STALE1")
    victim = db.query(User).filter(User.email == VICTIM_EMAIL).first()
    victim.created_at = datetime.now(timezone.utc) - timedelta(days=30)
    db.commit()

    assert _claim_via_otp(client, db, monkeypatch, VICTIM_EMAIL).status_code == 200

    db.refresh(victim)
    assert victim.pending_referral_code is None
    assert db.query(Referral).filter(Referral.referred_id == victim.id).first() is None
    assert victim.points == 1000.0
