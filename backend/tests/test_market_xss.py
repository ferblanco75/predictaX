"""Regression tests for #251: stored XSS via JSON-LD from market titles/descriptions."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

XSS_PAYLOAD = '</script><script>alert(1)</script>'


def _create_market_payload(**overrides) -> dict:
    payload = {
        "title": "Valid market title",
        "description": "Valid market description with enough length to pass validation.",
        "category": "tecnologia",
        "type": "binary",
        "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "probability": 60.0,
    }
    payload.update(overrides)
    return payload


def test_create_market_rejects_angle_brackets_in_title(client: TestClient, admin_headers):
    response = client.post(
        "/api/admin/markets",
        headers=admin_headers,
        json=_create_market_payload(title=f"Some title {XSS_PAYLOAD}"),
    )

    assert response.status_code == 422


def test_create_market_rejects_angle_brackets_in_description(client: TestClient, admin_headers):
    response = client.post(
        "/api/admin/markets",
        headers=admin_headers,
        json=_create_market_payload(description=f"Description {XSS_PAYLOAD} more text here"),
    )

    assert response.status_code == 422


def test_create_market_accepts_clean_title(client: TestClient, admin_headers):
    response = client.post(
        "/api/admin/markets",
        headers=admin_headers,
        json=_create_market_payload(),
    )

    assert response.status_code in (200, 201)


def test_edit_market_rejects_angle_brackets_in_title(
    client: TestClient, admin_headers, sample_market
):
    response = client.patch(
        f"/api/admin/markets/{sample_market.id}",
        headers=admin_headers,
        json={"title": f"Renamed {XSS_PAYLOAD}"},
    )

    assert response.status_code == 422


def test_create_market_requires_admin(client: TestClient, user_headers):
    response = client.post(
        "/api/admin/markets",
        headers=user_headers,
        json=_create_market_payload(),
    )

    assert response.status_code == 403
