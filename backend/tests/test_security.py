from fastapi.testclient import TestClient

from app.config import settings


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
