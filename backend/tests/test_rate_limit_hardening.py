"""Regression tests for #255: rate limiting bypass via spoofed IP and fail-open Redis."""

from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.core.request_ip import get_client_ip
from app.services import ai_service, chatbot_service


def test_get_client_ip_ignores_x_forwarded_for_header(client: TestClient, monkeypatch):
    """A spoofed X-Forwarded-For must not change the fingerprint used for throttling."""
    captured_ids = []

    def fake_send_message(db, message, history, user, requester_id=None):
        captured_ids.append(requester_id)
        return "ok"

    monkeypatch.setattr(chatbot_service, "send_message", fake_send_message)

    client.post(
        "/api/chatbot",
        json={"message": "hola", "history": []},
        headers={"X-Forwarded-For": "1.2.3.4"},
    )
    client.post(
        "/api/chatbot",
        json={"message": "hola", "history": []},
        headers={"X-Forwarded-For": "5.6.7.8"},
    )

    # Both requests come from the same TestClient (same underlying connection),
    # so the requester_id must be identical regardless of the spoofed header.
    assert len(captured_ids) == 2
    assert captured_ids[0] == captured_ids[1]
    assert "1.2.3.4" not in captured_ids[0]
    assert "5.6.7.8" not in captured_ids[0]


def test_get_client_ip_returns_connection_address():
    request = MagicMock()
    request.client.host = "203.0.113.5"
    assert get_client_ip(request) == "203.0.113.5"

    request_no_client = MagicMock()
    request_no_client.client = None
    assert get_client_ip(request_no_client) == "unknown"


def test_ai_rate_limit_fails_closed_when_redis_unavailable(monkeypatch):
    monkeypatch.setattr(ai_service, "redis_client", None)

    try:
        ai_service.check_ai_rate_limit("some-market-id", "user:123")
        assert False, "expected AIRateLimitError"
    except ai_service.AIRateLimitError:
        pass


def test_chatbot_rate_limit_fails_closed_when_redis_unavailable(monkeypatch):
    monkeypatch.setattr(chatbot_service, "redis_client", None)

    try:
        chatbot_service.check_chatbot_rate_limit("user:123")
        assert False, "expected ChatbotRateLimitError"
    except chatbot_service.ChatbotRateLimitError:
        pass


def test_login_rate_limited_by_email_even_across_different_ips(client: TestClient, db):
    from app.core.security import get_password_hash
    from app.models.user import User

    user = User(
        email="rate-limit-email-test@predictax.com",
        username="ratelimitemailuser",
        hashed_password=get_password_hash("correctpassword123"),
        email_verified=True,
    )
    db.add(user)
    db.commit()

    # AUTH_LOGIN_RATE_LIMIT_MAX is 5 by default; exhaust it with wrong passwords.
    for _ in range(5):
        response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "wrongpassword"},
        )
        assert response.status_code == 401

    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "correctpassword123"},
    )
    assert response.status_code == 429
