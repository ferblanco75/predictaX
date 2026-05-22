from datetime import timedelta

from fastapi.testclient import TestClient

from app.config import settings
from app.core.security import create_access_token, decode_token

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
LOGOUT_URL = "/api/auth/logout"
ME_URL = "/api/auth/me"

USER_DATA = {
    "email": "test@predictax.com",
    "username": "testuser",
    "password": "securepass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}


def test_register(client: TestClient):
    response = client.post(REGISTER_URL, json=USER_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == USER_DATA["email"]
    assert data["username"] == USER_DATA["username"]
    assert data["points"] == 1000.0
    assert data["terms_accepted_at"] is not None
    assert data["privacy_accepted_at"] is not None
    assert data["age_confirmed_at"] is not None
    assert data["legal_consent_version"] == settings.LEGAL_CONSENT_VERSION
    assert data["marketing_opt_in"] is False
    assert data["marketing_opt_in_at"] is None
    assert "id" in data
    assert "hashed_password" not in data


def test_register_normalizes_email_and_username(client: TestClient):
    response = client.post(
        REGISTER_URL,
        json={
            **USER_DATA,
            "email": "  Normalized@PredictaX.COM  ",
            "username": "  Test_User-1  ",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "normalized@predictax.com"
    assert data["username"] == "test_user-1"


def test_register_rejects_invalid_username_characters(client: TestClient):
    response = client.post(
        REGISTER_URL,
        json={**USER_DATA, "username": "<script>alert(1)</script>"},
    )

    assert response.status_code == 422


def test_register_records_marketing_opt_in(client: TestClient):
    response = client.post(
        REGISTER_URL,
        json={**USER_DATA, "email": "marketing@predictax.com", "marketing_opt_in": True},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["marketing_opt_in"] is True
    assert data["marketing_opt_in_at"] is not None


def test_register_requires_legal_consents(client: TestClient):
    for field in ("terms_accepted", "privacy_accepted", "is_adult"):
        response = client.post(REGISTER_URL, json={**USER_DATA, field: False})
        assert response.status_code == 422


def test_register_duplicate_email(client: TestClient):
    client.post(REGISTER_URL, json=USER_DATA)
    response = client.post(REGISTER_URL, json=USER_DATA)
    assert response.status_code == 400


def test_register_duplicate_username(client: TestClient):
    client.post(REGISTER_URL, json=USER_DATA)
    duplicate = {**USER_DATA, "email": "other@predictax.com"}
    response = client.post(REGISTER_URL, json=duplicate)
    assert response.status_code == 400


def test_register_invalid_email(client: TestClient):
    bad_data = {**USER_DATA, "email": "not-an-email"}
    response = client.post(REGISTER_URL, json=bad_data)
    assert response.status_code == 422


def test_register_short_password(client: TestClient):
    bad_data = {**USER_DATA, "password": "short"}
    response = client.post(REGISTER_URL, json=bad_data)
    assert response.status_code == 422


def test_login(client: TestClient):
    client.post(REGISTER_URL, json=USER_DATA)
    response = client.post(
        LOGIN_URL,
        json={"email": USER_DATA["email"], "password": USER_DATA["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient):
    client.post(REGISTER_URL, json=USER_DATA)
    response = client.post(
        LOGIN_URL,
        json={"email": USER_DATA["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    response = client.post(
        LOGIN_URL,
        json={"email": "nobody@predictax.com", "password": "whatever"},
    )
    assert response.status_code == 401


def test_login_rate_limit_returns_429(client: TestClient):
    register_response = client.post(REGISTER_URL, json=USER_DATA)
    assert register_response.status_code == 201

    for _ in range(5):
        response = client.post(
            LOGIN_URL,
            json={"email": USER_DATA["email"], "password": "wrongpassword"},
        )
        assert response.status_code == 401

    response = client.post(
        LOGIN_URL,
        json={"email": USER_DATA["email"], "password": "wrongpassword"},
    )

    assert response.status_code == 429
    assert response.json()["detail"] == "Too many authentication attempts. Try again later."
    assert response.headers["retry-after"].isdigit()


def test_register_rate_limit_returns_429(client: TestClient):
    for index in range(3):
        response = client.post(
            REGISTER_URL,
            json={
                "email": f"rate-limit-{index}@predictax.com",
                "username": f"ratelimit{index}",
                "password": "securepass123",
                "terms_accepted": True,
                "privacy_accepted": True,
                "is_adult": True,
            },
        )
        assert response.status_code == 201

    response = client.post(
        REGISTER_URL,
        json={
            "email": "rate-limit-3@predictax.com",
            "username": "ratelimit3",
            "password": "securepass123",
            "terms_accepted": True,
            "privacy_accepted": True,
            "is_adult": True,
        },
    )

    assert response.status_code == 429
    assert response.headers["retry-after"].isdigit()


def test_access_token_roundtrip():
    token = create_access_token({"sub": "user-123"})

    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user-123"


def test_decode_token_rejects_expired_token():
    token = create_access_token(
        {"sub": "user-123"}, expires_delta=timedelta(seconds=-1)
    )

    assert decode_token(token) is None


def test_decode_token_rejects_invalid_token():
    assert decode_token("invalid.token.here") is None


def test_protected_route(client: TestClient):
    # Register and login to get token
    client.post(REGISTER_URL, json=USER_DATA)
    login_resp = client.post(
        LOGIN_URL,
        json={"email": USER_DATA["email"], "password": USER_DATA["password"]},
    )
    token = login_resp.json()["access_token"]

    response = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == USER_DATA["email"]
    assert data["username"] == USER_DATA["username"]


def test_protected_route_no_token(client: TestClient):
    # HTTPBearer returns 403 when the Authorization header is missing entirely
    response = client.get(ME_URL)
    assert response.status_code == 403


def test_protected_route_invalid_token(client: TestClient):
    response = client.get(ME_URL, headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code == 401


def test_logout(client: TestClient):
    client.post(REGISTER_URL, json=USER_DATA)
    login_resp = client.post(
        LOGIN_URL,
        json={"email": USER_DATA["email"], "password": USER_DATA["password"]},
    )
    token = login_resp.json()["access_token"]

    response = client.post(LOGOUT_URL, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


def test_logout_no_token(client: TestClient):
    response = client.post(LOGOUT_URL)
    assert response.status_code == 403
