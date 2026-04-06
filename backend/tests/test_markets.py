import pytest
from fastapi.testclient import TestClient


def test_list_markets(client: TestClient, sample_markets):
    """List all markets returns data."""
    response = client.get("/api/markets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5


def test_list_markets_filter_category(client: TestClient, sample_markets):
    """Filter markets by category."""
    response = client.get("/api/markets?category=crypto")
    assert response.status_code == 200
    data = response.json()
    assert all(m["category"] == "crypto" for m in data)


def test_list_markets_filter_status(client: TestClient, sample_markets):
    """Filter markets by status."""
    response = client.get("/api/markets?status=active")
    assert response.status_code == 200
    data = response.json()
    assert all(m["status"] == "active" for m in data)


def test_list_markets_pagination(client: TestClient, sample_markets):
    """Pagination with limit and offset."""
    response = client.get("/api/markets?limit=2&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2


def test_get_market_by_id(client: TestClient, sample_market):
    """Get single market by ID."""
    response = client.get(f"/api/markets/{sample_market.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == sample_market.title
    assert "probability" in data
    assert "history" in data


def test_get_market_not_found(client: TestClient):
    """404 for non-existent market."""
    response = client.get("/api/markets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_get_market_history(client: TestClient, sample_market):
    """Get market probability history."""
    response = client.get(f"/api/markets/{sample_market.id}/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_market_response_format(client: TestClient, sample_market):
    """Verify market response has correct fields."""
    response = client.get(f"/api/markets/{sample_market.id}")
    data = response.json()
    required_fields = ["id", "title", "description", "category", "probability",
                       "volume", "participants", "endDate", "status", "history"]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"
