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
    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["market_title"] == sample_market.title
    assert data["predictions"][0]["points_wagered"] == 25
    assert "activity_logs" in data
    assert "ai_usage" in data
