"""Regression tests for #283: /register enumerated accounts, /login leaked timing.

A taken email used to answer 400 with an explicit message while a free one
answered 201 — a clean oracle over the whole user base. The owner is warned by
email now, and the caller cannot tell the two apart.
"""

from fastapi.testclient import TestClient

from app.config import settings
from app.models.user import User
from app.services import auth_service

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"

EXISTING = {
    "email": "taken-283@predictax.com",
    "username": "taken283",
    "password": "securepass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}


def _register_payload(email: str, username: str) -> dict:
    return {
        "email": email,
        "username": username,
        "terms_accepted": True,
        "privacy_accepted": True,
        "is_adult": True,
    }


# Unique per request whichever branch answered, plus the two fields the caller
# supplied itself — everything else must match across the two responses.
_VOLATILE_FIELDS = {
    "id",
    "email",
    "username",
    "created_at",
    "terms_accepted_at",
    "privacy_accepted_at",
    "age_confirmed_at",
    "marketing_opt_in_at",
}


def _comparable(body: dict) -> dict:
    return {k: v for k, v in body.items() if k not in _VOLATILE_FIELDS}


def test_register_response_is_identical_for_existing_and_new_email(
    client: TestClient, monkeypatch
):
    monkeypatch.setattr(auth_service.otp_service, "send_registration_attempt_email", lambda e: True)
    # One IP per call, so the probes are not answered by the rate limiter.
    addresses = iter(f"203.0.113.{n}" for n in range(1, 20))
    monkeypatch.setattr("app.routers.auth.get_client_ip", lambda request: next(addresses))
    client.post(REGISTER_URL, json=EXISTING)

    taken = client.post(REGISTER_URL, json=_register_payload(EXISTING["email"], "probe283"))
    fresh = client.post(REGISTER_URL, json=_register_payload("free-283@predictax.com", "probe283b"))

    assert taken.status_code == fresh.status_code == 201
    assert taken.json().keys() == fresh.json().keys()
    assert _comparable(taken.json()) == _comparable(fresh.json())
    # The volatile fields are present and populated the same way in both.
    for field in ("id", "created_at", "terms_accepted_at", "privacy_accepted_at"):
        assert taken.json()[field] is not None
        assert fresh.json()[field] is not None
    assert taken.json()["email"] == EXISTING["email"]


def test_register_on_taken_email_warns_the_owner_instead_of_the_caller(
    client: TestClient, db, monkeypatch
):
    notified = []
    monkeypatch.setattr(
        auth_service.otp_service,
        "send_registration_attempt_email",
        lambda email: notified.append(email) or True,
    )
    client.post(REGISTER_URL, json=EXISTING)

    response = client.post(REGISTER_URL, json=_register_payload(EXISTING["email"], "probe283"))

    assert response.status_code == 201
    assert notified == [EXISTING["email"]]
    # The decoy is never persisted and the real account is untouched.
    assert db.query(User).filter(User.email == EXISTING["email"]).count() == 1
    owner = db.query(User).filter(User.email == EXISTING["email"]).first()
    assert owner.username == EXISTING["username"]
    assert str(owner.id) != response.json()["id"]


def test_register_is_rate_limited_per_email(client: TestClient, monkeypatch):
    """The IP bucket alone let an attacker spread over many IPs hammer a single
    address. Each request here comes from a different IP."""
    addresses = iter(f"203.0.113.{n}" for n in range(1, 20))
    monkeypatch.setattr(auth_service.otp_service, "send_registration_attempt_email", lambda e: True)
    monkeypatch.setattr("app.routers.auth.get_client_ip", lambda request: next(addresses))

    # The first call creates the account; the rest are probes against it.
    for _ in range(settings.AUTH_REGISTER_RATE_LIMIT_MAX):
        response = client.post(
            REGISTER_URL, json=_register_payload(EXISTING["email"], "probe283")
        )
        assert response.status_code == 201

    response = client.post(REGISTER_URL, json=_register_payload(EXISTING["email"], "probe283"))
    assert response.status_code == 429


def test_failed_login_costs_the_same_bcrypt_work_for_every_account_state(
    client: TestClient, db, monkeypatch
):
    """A nonexistent user and an OTP-only user used to fail instantly while a
    password account paid for bcrypt, which told an attacker which emails have
    a password."""
    calls = []
    real_verify = auth_service.verify_password
    monkeypatch.setattr(
        auth_service,
        "verify_password",
        lambda password, hashed: calls.append(hashed) or real_verify(password, hashed),
    )

    client.post(REGISTER_URL, json=EXISTING)
    db.add(
        User(
            email="otp-only-283@predictax.com",
            username="otponly283",
            hashed_password="",
            email_verified=True,
            points=1000.0,
        )
    )
    db.commit()

    for email in (
        "nobody-283@predictax.com",
        "otp-only-283@predictax.com",
        EXISTING["email"],
    ):
        response = client.post(LOGIN_URL, json={"email": email, "password": "wrongpassword"})
        assert response.status_code in (400, 401)

    # One bcrypt verification per attempt, whatever the account state.
    assert len(calls) == 3
