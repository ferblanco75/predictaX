from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models.activity_log import ActivityLog
from app.routers.users import ACTIVE_USERS_FLOOR_MAX, ACTIVE_USERS_FLOOR_MIN


def test_active_count_no_auth_required(client: TestClient):
    response = client.get("/api/users/active-count")
    assert response.status_code == 200
    assert "active_users" in response.json()


def test_active_count_floors_to_a_credible_range_when_traffic_is_low(client: TestClient):
    response = client.get("/api/users/active-count")
    count = response.json()["active_users"]
    assert ACTIVE_USERS_FLOOR_MIN <= count <= ACTIVE_USERS_FLOOR_MAX


def test_active_count_is_stable_across_requests_in_the_same_hour(client: TestClient):
    first = client.get("/api/users/active-count").json()["active_users"]
    second = client.get("/api/users/active-count").json()["active_users"]
    assert first == second


def test_active_count_reflects_real_traffic_once_it_exceeds_the_floor(
    client: TestClient, db
):
    now = datetime.now(timezone.utc)
    # More distinct IPs within the last hour than the floor's ceiling.
    for i in range(ACTIVE_USERS_FLOOR_MAX + 50):
        db.add(
            ActivityLog(
                action="api_request",
                endpoint="GET /api/markets",
                ip_address=f"10.0.{i // 256}.{i % 256}",
                status_code=200,
                created_at=now - timedelta(minutes=5),
            )
        )
    db.commit()

    response = client.get("/api/users/active-count")
    assert response.status_code == 200
    assert response.json()["active_users"] >= ACTIVE_USERS_FLOOR_MAX + 50


def test_active_count_ignores_activity_older_than_one_hour(client: TestClient, db):
    now = datetime.now(timezone.utc)
    for i in range(ACTIVE_USERS_FLOOR_MAX + 50):
        db.add(
            ActivityLog(
                action="api_request",
                endpoint="GET /api/markets",
                ip_address=f"10.1.{i // 256}.{i % 256}",
                status_code=200,
                created_at=now - timedelta(hours=2),
            )
        )
    db.commit()

    response = client.get("/api/users/active-count")
    count = response.json()["active_users"]
    # Stale activity must not count — falls back to the hourly floor.
    assert ACTIVE_USERS_FLOOR_MIN <= count <= ACTIVE_USERS_FLOOR_MAX
