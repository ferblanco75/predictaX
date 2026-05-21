from fastapi.testclient import TestClient

from app.config import settings
from app.main import should_track_api_request


def test_api_security_headers(client: TestClient):
    """API responses include baseline security headers."""
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["cross-origin-resource-policy"] == "cross-origin"
    assert "camera=()" in response.headers["permissions-policy"]


def test_metrics_respects_environment_setting(client: TestClient):
    """Metrics exposure follows the explicit METRICS_ENABLED setting."""
    response = client.get("/api/metrics")

    expected_status = 200 if settings.METRICS_ENABLED else 404
    assert response.status_code == expected_status


def test_api_docs_follow_debug_setting(client: TestClient):
    """Swagger, ReDoc and OpenAPI schema are disabled outside debug mode."""
    expected_status = 200 if settings.DEBUG else 404

    assert client.get("/api/docs").status_code == expected_status
    assert client.get("/api/redoc").status_code == expected_status
    assert client.get("/api/openapi.json").status_code == expected_status


def test_activity_tracking_skips_noisy_admin_metrics():
    """High-volume admin polling endpoints should not write activity logs."""
    assert should_track_api_request("/api/markets") is True
    assert should_track_api_request("/api/admin/users/123/toggle-active") is True
    assert should_track_api_request("/api/admin/metrics/overview") is False
    assert should_track_api_request("/api/admin/ai/usage/summary") is False
    assert should_track_api_request("/api/admin/activity/recent") is False
    assert should_track_api_request("/api/health") is False
