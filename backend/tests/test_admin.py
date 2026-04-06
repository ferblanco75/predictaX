import pytest
from fastapi.testclient import TestClient


# --------------- Access Control ---------------

def test_admin_overview_no_auth(client: TestClient):
    """Admin overview without token returns 403."""
    response = client.get("/api/admin/metrics/overview")
    assert response.status_code == 403


def test_admin_overview_user_role(client: TestClient, user_headers):
    """Regular user cannot access admin endpoints."""
    response = client.get("/api/admin/metrics/overview", headers=user_headers)
    assert response.status_code == 403


def test_admin_overview_success(client: TestClient, admin_headers, sample_markets):
    """Admin can access overview."""
    response = client.get("/api/admin/metrics/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "markets" in data
    assert "predictions" in data
    assert "ai" in data


def test_admin_overview_structure(client: TestClient, admin_headers, sample_markets):
    """Overview has correct structure."""
    response = client.get("/api/admin/metrics/overview", headers=admin_headers)
    data = response.json()

    assert "total" in data["users"]
    assert "new_today" in data["users"]
    assert "active" in data["markets"]
    assert "by_category" in data["markets"]
    assert "total" in data["predictions"]
    assert "quota_used" in data["ai"]
    assert "quota_limit" in data["ai"]


# --------------- Users ---------------

def test_admin_users_list(client: TestClient, admin_headers, registered_user):
    """List all users."""
    response = client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert data["total"] >= 1


def test_admin_users_search(client: TestClient, admin_headers, registered_user):
    """Search users by username."""
    response = client.get("/api/admin/users?search=testuser", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert any(u["username"] == "testuser" for u in data["data"])


def test_admin_users_search_empty(client: TestClient, admin_headers):
    """Search with no results."""
    response = client.get("/api/admin/users?search=nonexistent12345", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0


def test_admin_user_detail(client: TestClient, admin_headers, registered_user):
    """Get user detail by ID."""
    user_id = registered_user["id"]
    response = client.get(f"/api/admin/users/{user_id}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@predictax.com"
    assert "predictions" in data


def test_admin_user_detail_not_found(client: TestClient, admin_headers):
    """User detail 404."""
    response = client.get(
        "/api/admin/users/00000000-0000-0000-0000-000000000000",
        headers=admin_headers,
    )
    assert response.status_code == 404


# --------------- Markets Ranking ---------------

def test_admin_markets_ranking(client: TestClient, admin_headers, sample_markets):
    """Get markets ranking."""
    response = client.get("/api/admin/metrics/markets/ranking", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_admin_markets_ranking_sort(client: TestClient, admin_headers, sample_markets):
    """Sort markets by different criteria."""
    for sort in ["most_active", "least_active", "most_volume", "most_participants"]:
        response = client.get(
            f"/api/admin/metrics/markets/ranking?sort={sort}",
            headers=admin_headers,
        )
        assert response.status_code == 200


def test_admin_markets_ranking_limit(client: TestClient, admin_headers, sample_markets):
    """Limit ranking results."""
    response = client.get(
        "/api/admin/metrics/markets/ranking?limit=2",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2


# --------------- Predictions ---------------

def test_admin_predictions_daily(client: TestClient, admin_headers):
    """Get daily predictions."""
    response = client.get("/api/admin/metrics/predictions/daily", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# --------------- AI ---------------

def test_admin_ai_usage_summary(client: TestClient, admin_headers):
    """Get AI usage summary."""
    response = client.get("/api/admin/ai/usage/summary", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "today" in data
    assert "quota" in data
    assert data["quota"]["daily_limit"] == 250


def test_admin_ai_usage_history(client: TestClient, admin_headers):
    """Get AI usage history."""
    response = client.get("/api/admin/ai/usage/history", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# --------------- User Engagement ---------------

def test_admin_top_active_users(client: TestClient, admin_headers):
    """Get top active users."""
    response = client.get("/api/admin/metrics/users/top-active", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_admin_inactive_users(client: TestClient, admin_headers):
    """Get inactive users."""
    response = client.get("/api/admin/metrics/users/inactive", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_admin_user_engagement(client: TestClient, admin_headers):
    """Get user engagement metrics."""
    response = client.get("/api/admin/metrics/users/engagement", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "by_hour" in data
    assert "by_day_of_week" in data


# --------------- Categories ---------------

def test_admin_category_interest(client: TestClient, admin_headers):
    """Get category interest."""
    response = client.get("/api/admin/metrics/categories/interest", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# --------------- Performance ---------------

def test_admin_performance(client: TestClient, admin_headers):
    """Get site performance metrics."""
    response = client.get("/api/admin/metrics/performance", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "slowest_endpoints" in data
    assert "most_hit_endpoints" in data


# --------------- Activity Feed ---------------

def test_admin_recent_activity(client: TestClient, admin_headers):
    """Get recent activity feed."""
    response = client.get("/api/admin/activity/recent", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# --------------- All admin endpoints blocked for regular user ---------------

def test_all_admin_endpoints_blocked_for_user(client: TestClient, user_headers):
    """No admin endpoint is accessible by regular users."""
    endpoints = [
        "/api/admin/metrics/overview",
        "/api/admin/users",
        "/api/admin/metrics/markets/ranking",
        "/api/admin/metrics/predictions/daily",
        "/api/admin/ai/usage/summary",
        "/api/admin/ai/usage/history",
        "/api/admin/metrics/users/top-active",
        "/api/admin/metrics/users/inactive",
        "/api/admin/metrics/users/engagement",
        "/api/admin/metrics/categories/interest",
        "/api/admin/metrics/performance",
        "/api/admin/activity/recent",
    ]
    for endpoint in endpoints:
        response = client.get(endpoint, headers=user_headers)
        assert response.status_code == 403, f"{endpoint} should be 403 for regular user"
