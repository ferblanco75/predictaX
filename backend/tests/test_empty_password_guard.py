"""Regression tests for #258: empty hashed_password must never reach passlib."""

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.models.user import User


def _create_otp_user(db, email: str, username: str) -> User:
    user = User(
        email=email,
        username=username,
        hashed_password="",
        email_verified=True,
        points=1000.0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_password_login_for_otp_only_user_returns_401_not_500(client: TestClient, db):
    _create_otp_user(db, "otp-only@predictax.com", "otponlyuser")

    response = client.post(
        "/api/auth/login",
        json={"email": "otp-only@predictax.com", "password": "anything123"},
    )

    assert response.status_code == 401


def test_otp_only_user_can_delete_account_without_password(client: TestClient, db):
    user = _create_otp_user(db, "otp-delete@predictax.com", "otpdeleteuser")
    token = create_access_token(data={"sub": str(user.id)})

    response = client.request(
        "DELETE",
        "/api/users/me",
        json={"password": "irrelevant-but-min-length", "confirm_delete": True},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
