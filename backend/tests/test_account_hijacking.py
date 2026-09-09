"""Regression tests for #252: account pre-hijacking via unverified password registration."""

from fastapi.testclient import TestClient

from app.models.user import User

VICTIM_EMAIL = "victim@predictax.com"
ATTACKER_PASSWORD = "attackerpass123"


def _register_with_password(client: TestClient, email: str, password: str, username: str):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "username": username,
            "password": password,
            "terms_accepted": True,
            "privacy_accepted": True,
            "is_adult": True,
        },
    )


def test_password_login_blocked_until_email_verified(client: TestClient):
    """An attacker who registers someone else's email cannot log in with it yet,
    since the frontend never surfaces a login the attacker could use — but the
    API itself must also refuse it."""
    response = _register_with_password(client, VICTIM_EMAIL, ATTACKER_PASSWORD, "attacker1")
    assert response.status_code == 201

    login_response = client.post(
        "/api/auth/login", json={"email": VICTIM_EMAIL, "password": ATTACKER_PASSWORD}
    )

    assert login_response.status_code == 400
    assert "confirmá" in login_response.json()["detail"].lower()


def test_otp_login_invalidates_pre_existing_unverified_password(
    client: TestClient, db, monkeypatch
):
    """The real owner claiming the account via OTP must wipe out any password
    an attacker set during pre-registration."""
    _register_with_password(client, VICTIM_EMAIL, ATTACKER_PASSWORD, "attacker2")

    user_before = db.query(User).filter(User.email == VICTIM_EMAIL).first()
    assert user_before.hashed_password != ""
    assert user_before.email_verified is False

    from app.services import otp_service

    monkeypatch.setattr(otp_service, "_send_otp_email", lambda email, code: True)
    client.post("/api/auth/otp/request", json={"email": VICTIM_EMAIL})

    otp = (
        db.query(otp_service.OTPCode)
        .filter(otp_service.OTPCode.email == VICTIM_EMAIL)
        .order_by(otp_service.OTPCode.created_at.desc())
        .first()
    )
    verify_response = client.post(
        "/api/auth/otp/verify", json={"email": VICTIM_EMAIL, "code": otp.code}
    )
    assert verify_response.status_code == 200

    db.refresh(user_before)
    assert user_before.hashed_password == ""
    assert user_before.email_verified is True

    # The attacker's original password must no longer work.
    stale_login = client.post(
        "/api/auth/login", json={"email": VICTIM_EMAIL, "password": ATTACKER_PASSWORD}
    )
    assert stale_login.status_code == 401


def test_verified_password_account_can_still_log_in_normally(client: TestClient, db):
    """A legitimate password login keeps working once the account is verified."""
    email = "verified-user@predictax.com"
    password = "legitpass123"
    _register_with_password(client, email, password, "legituser")

    user = db.query(User).filter(User.email == email).first()
    user.email_verified = True
    db.commit()

    login_response = client.post("/api/auth/login", json={"email": email, "password": password})

    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
