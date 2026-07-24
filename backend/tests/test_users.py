from fastapi.testclient import TestClient

from app.models.prediction import Prediction
from app.models.user import User


def test_data_export_requires_auth(client: TestClient):
    response = client.get("/api/users/me/data-export")

    assert response.status_code == 403


def test_data_export_includes_profile_consents_and_predictions(
    client: TestClient,
    db,
    user_headers,
    sample_market,
):
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    prediction = Prediction(
        user_id=user.id,
        market_id=sample_market.id,
        probability=62.5,
        points_wagered=25,
        potential_gain=40,
        status="pending",
    )
    db.add(prediction)
    db.commit()

    response = client.get("/api/users/me/data-export", headers=user_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["export_version"] == "2026-05-21"
    assert data["profile"]["email"] == "test@predictax.com"
    assert data["consents"]["terms_accepted_at"] is not None
    assert data["consents"]["privacy_accepted_at"] is not None
    assert data["consents"]["age_confirmed_at"] is not None
    assert data["consents"]["marketing_opt_in"] is False
    assert data["consents"]["cookie_consent"]["analytics"] is False
    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["market_title"] == sample_market.title
    assert data["predictions"][0]["points_wagered"] == 25
    assert "activity_logs" in data
    assert "ai_usage" in data


def test_update_cookie_consent_persists_choices(client: TestClient, db, user_headers):
    response = client.put(
        "/api/users/me/cookie-consent",
        headers=user_headers,
        json={
            "essential": True,
            "analytics": True,
            "functional": True,
            "marketing": False,
            "version": "2026-05-21",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["analytics"] is True
    assert data["functional"] is True
    assert data["marketing"] is False
    assert data["version"] == "2026-05-21"
    assert data["updated_at"] is not None

    user = db.query(User).filter(User.email == "test@predictax.com").first()
    assert user.cookie_consent_analytics is True
    assert user.cookie_consent_functional is True
    assert user.cookie_consent_marketing is False
    assert user.cookie_consent_version == "2026-05-21"
    assert user.cookie_consent_updated_at is not None


def test_update_cookie_consent_requires_essential(client: TestClient, user_headers):
    response = client.put(
        "/api/users/me/cookie-consent",
        headers=user_headers,
        json={"essential": False, "analytics": True},
    )

    assert response.status_code == 422


def test_delete_account_requires_confirmation(client: TestClient, user_headers):
    response = client.request(
        "DELETE",
        "/api/users/me",
        headers=user_headers,
        json={"password": "securepass123", "confirm_delete": False},
    )

    assert response.status_code == 422


def test_delete_account_rejects_wrong_password(client: TestClient, user_headers):
    response = client.request(
        "DELETE",
        "/api/users/me",
        headers=user_headers,
        json={"password": "wrongpass123", "confirm_delete": True},
    )

    assert response.status_code == 401


def test_delete_account_anonymizes_and_deactivates_user(client: TestClient, db, user_headers):
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    user_id = user.id

    response = client.request(
        "DELETE",
        "/api/users/me",
        headers=user_headers,
        json={"password": "securepass123", "confirm_delete": True},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Account anonymized and deactivated"

    db.refresh(user)
    assert user.id == user_id
    assert user.email == f"deleted-{user_id}@deleted.local"
    assert user.username == f"deleted-{user_id}"
    assert user.points == 0
    assert user.role == "user"
    assert user.is_active is False
    assert user.marketing_opt_in is False
    assert user.marketing_opt_in_at is None
    assert user.cookie_consent_analytics is False
    assert user.cookie_consent_functional is False
    assert user.cookie_consent_marketing is False
    assert user.cookie_consent_version is None
    assert user.cookie_consent_updated_at is None
    assert user.deleted_at is not None

    me_response = client.get("/api/auth/me", headers=user_headers)
    assert me_response.status_code == 401
