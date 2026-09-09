import re

from fastapi.testclient import TestClient

from app.config import settings


def test_otp_request_never_logs_the_code(client: TestClient, caplog):
    """Regression test for #253: OTP codes must never reach the logs."""
    response = client.post(
        "/api/auth/otp/request", json={"email": "otp-log-test@predictax.com"}
    )

    assert response.status_code in (200, 503)

    log_text = "\n".join(record.message for record in caplog.records)
    assert not re.search(r"\b\d{6}\b", log_text), "An OTP-shaped code leaked into the logs"


def test_otp_request_returns_503_when_email_not_configured(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(settings, "DEBUG", False)

    response = client.post(
        "/api/auth/otp/request", json={"email": "otp-503-test@predictax.com"}
    )

    assert response.status_code == 503


def test_otp_request_still_succeeds_in_debug_without_email(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(settings, "DEBUG", True)

    response = client.post(
        "/api/auth/otp/request", json={"email": "otp-debug-test@predictax.com"}
    )

    assert response.status_code == 200
    assert response.json()["email_sent"] is False
