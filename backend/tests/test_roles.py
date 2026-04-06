import pytest
from fastapi.testclient import TestClient


def test_new_user_has_user_role(client: TestClient, registered_user):
    """New users default to 'user' role."""
    assert registered_user.get("role", "user") == "user"


def test_admin_user_has_admin_role(client: TestClient, admin_user, admin_headers):
    """Admin user has admin role."""
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_regular_user_cannot_access_admin(client: TestClient, user_headers):
    """Regular user gets 403 on admin endpoints."""
    response = client.get("/api/admin/metrics/overview", headers=user_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


def test_admin_can_access_admin(client: TestClient, admin_headers, sample_markets):
    """Admin user can access admin endpoints."""
    response = client.get("/api/admin/metrics/overview", headers=admin_headers)
    assert response.status_code == 200


def test_no_token_gets_403(client: TestClient):
    """No token returns 403 (HTTPBearer behavior)."""
    response = client.get("/api/admin/metrics/overview")
    assert response.status_code == 403


def test_invalid_token_gets_401(client: TestClient):
    """Invalid token returns 401."""
    response = client.get(
        "/api/admin/metrics/overview",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


def test_me_returns_role(client: TestClient, user_headers):
    """GET /auth/me includes role field."""
    response = client.get("/api/auth/me", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "role" in data
    assert data["role"] == "user"
