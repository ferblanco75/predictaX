"""Regression tests for #260: DoS surface and security-log evasion."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.core.tracking import log_activity


def test_log_activity_truncates_oversized_endpoint():
    """A padded path must not raise past log_activity's try/except (#260
    finding 1) — that was how an attacker evaded tracking entirely.

    log_activity opens its own SessionLocal() independent of the `db` test
    fixture's transactional session, so this reads back with a fresh one.
    """
    from app.core.database import SessionLocal
    from app.models.activity_log import ActivityLog

    marker = "oversized-endpoint-test-marker"
    huge_endpoint = f"GET /api/markets/{marker}/" + ("x" * 5000)
    log_activity(action=marker, endpoint=huge_endpoint, status_code=200)

    verify_db = SessionLocal()
    try:
        log = (
            verify_db.query(ActivityLog)
            .filter(ActivityLog.action == marker)
            .order_by(ActivityLog.created_at.desc())
            .first()
        )
        assert log is not None
        assert len(log.endpoint) <= 200
    finally:
        verify_db.query(ActivityLog).filter(ActivityLog.action == marker).delete()
        verify_db.commit()
        verify_db.close()


def test_oversized_request_body_rejected_with_413(client: TestClient):
    huge_body = "x" * (2 * 1024 * 1024)
    response = client.post(
        "/api/chatbot",
        content=huge_body,
        headers={"Content-Type": "application/json", "Content-Length": str(len(huge_body))},
    )
    assert response.status_code == 413


def test_market_predictions_endpoint_is_paginated(client: TestClient, db, sample_market):
    from app.models.prediction import Prediction
    from app.models.user import User

    user = User(
        email="pagination-test@predictax.com", username="paginationuser", hashed_password=""
    )
    db.add(user)
    db.commit()

    for i in range(5):
        db.add(
            Prediction(
                user_id=user.id,
                market_id=sample_market.id,
                probability=60,
                points_wagered=10,
            )
        )
    db.commit()

    response = client.get(f"/api/predictions/market/{sample_market.id}?limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_market_predictions_limit_is_capped(client: TestClient, sample_market):
    response = client.get(f"/api/predictions/market/{sample_market.id}?limit=99999")
    assert response.status_code == 422


def test_inactive_users_days_param_is_bounded(client: TestClient, admin_headers):
    response = client.get(
        "/api/admin/metrics/users/inactive?days=999999999999", headers=admin_headers
    )
    assert response.status_code == 422


def test_site_performance_computes_percentiles_in_sql(client: TestClient, admin_headers, db):
    from app.models.activity_log import ActivityLog

    for ms in (100, 200, 300, 400, 500):
        db.add(
            ActivityLog(
                action="api_request",
                endpoint="GET /api/markets",
                response_time_ms=ms,
                status_code=200,
                created_at=datetime.now(timezone.utc) - timedelta(hours=1),
            )
        )
    db.commit()

    response = client.get("/api/admin/metrics/performance?days=7", headers=admin_headers)
    assert response.status_code == 200
    summary = response.json()["summary"]
    assert summary["p50_ms"] > 0
    assert summary["p95_ms"] > 0
    assert summary["p99_ms"] > 0


def test_list_markets_invalid_category_returns_422(client: TestClient):
    response = client.get("/api/markets?category=not-a-real-category")
    assert response.status_code == 422


def test_list_markets_invalid_status_returns_422(client: TestClient):
    response = client.get("/api/markets?status=not-a-real-status")
    assert response.status_code == 422


def test_get_market_invalid_uuid_returns_422_not_500(client: TestClient):
    response = client.get("/api/markets/not-a-valid-uuid")
    assert response.status_code == 422


def test_otp_request_rate_limited_by_ip_across_different_emails(client: TestClient, monkeypatch):
    from app.services import otp_service

    monkeypatch.setattr(otp_service, "_send_otp_email", lambda email, code: True)

    for i in range(10):
        response = client.post(
            "/api/auth/otp/request", json={"email": f"ip-rate-limit-{i}@predictax.com"}
        )
        assert response.status_code == 200

    response = client.post(
        "/api/auth/otp/request", json={"email": "ip-rate-limit-overflow@predictax.com"}
    )
    assert response.status_code == 429


def test_otp_verify_is_rate_limited(client: TestClient):
    for _ in range(10):
        response = client.post(
            "/api/auth/otp/verify",
            json={"email": "verify-rate-limit@predictax.com", "code": "000000"},
        )
        assert response.status_code == 400  # invalid/expired code, but not rate limited yet

    response = client.post(
        "/api/auth/otp/verify",
        json={"email": "verify-rate-limit@predictax.com", "code": "000000"},
    )
    assert response.status_code == 429
