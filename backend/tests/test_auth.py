import pytest
from fastapi.testclient import TestClient


REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"

USER_DATA = {
    "email": "test@predictax.com",
    "username": "testuser",
    "password": "securepass123",
}


def test_register(client: TestClient):
    response = client.post(REGISTER_URL, json=USER_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == USER_DATA["email"]
    assert data["username"] == USER_DATA["username"]
    assert data["points"] == 1000.0
    assert "id" in data
    assert "hashed_password" not in data


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
