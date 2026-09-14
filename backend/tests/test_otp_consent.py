"""Regression tests for #258 (remaining item): OTP signups must capture legal consent."""

from fastapi.testclient import TestClient

from app.models.user import User
from app.services import otp_service


def _request_and_get_code(client: TestClient, monkeypatch, db, email: str) -> str:
    monkeypatch.setattr(otp_service, "_send_otp_email", lambda email, code: True)
    client.post("/api/auth/otp/request", json={"email": email})

    record = (
        db.query(otp_service.OTPCode)
        .filter(otp_service.OTPCode.email == email)
        .order_by(otp_service.OTPCode.created_at.desc())
        .first()
    )
    return record.code


def test_new_signup_via_otp_requires_full_consent(client: TestClient, monkeypatch, db):
    email = "otp-consent-missing@predictax.com"
    code = _request_and_get_code(client, monkeypatch, db, email)

    response = client.post(
        "/api/auth/otp/verify",
        json={"email": email, "code": code, "terms_accepted": True, "privacy_accepted": True},
        # is_adult omitted
    )

    assert response.status_code == 400
    assert "aceptar" in response.json()["detail"].lower()


def test_new_signup_via_otp_succeeds_with_full_consent(client: TestClient, monkeypatch, db):
    email = "otp-consent-full@predictax.com"
    code = _request_and_get_code(client, monkeypatch, db, email)

    response = client.post(
        "/api/auth/otp/verify",
        json={
            "email": email,
            "code": code,
            "terms_accepted": True,
            "privacy_accepted": True,
            "is_adult": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["is_new_user"] is True

    user = db.query(User).filter(User.email == email).first()
    assert user.terms_accepted_at is not None
    assert user.privacy_accepted_at is not None
    assert user.age_confirmed_at is not None
    assert user.legal_consent_version is not None


def test_missing_consent_does_not_burn_the_otp_code(client: TestClient, monkeypatch, db):
    """A user who forgets a checkbox can resubmit the same code — the
    rejection must happen before the code is marked used."""
    email = "otp-consent-retry@predictax.com"
    code = _request_and_get_code(client, monkeypatch, db, email)

    first = client.post(
        "/api/auth/otp/verify",
        json={"email": email, "code": code, "terms_accepted": True},
    )
    assert first.status_code == 400

    second = client.post(
        "/api/auth/otp/verify",
        json={
            "email": email,
            "code": code,
            "terms_accepted": True,
            "privacy_accepted": True,
            "is_adult": True,
        },
    )
    assert second.status_code == 200


def test_existing_user_otp_login_does_not_require_consent(client: TestClient, monkeypatch, db):
    """Logging in via OTP to an already-existing, already-consented account
    must not suddenly demand new checkboxes."""
    email = "otp-existing-user@predictax.com"
    user = User(
        email=email,
        username="otpexistinguser",
        hashed_password="",
        email_verified=True,
        points=1000.0,
    )
    db.add(user)
    db.commit()

    code = _request_and_get_code(client, monkeypatch, db, email)

    response = client.post("/api/auth/otp/verify", json={"email": email, "code": code})

    assert response.status_code == 200
    assert response.json()["is_new_user"] is False
