from fastapi.testclient import TestClient

from app.models.prediction import Prediction
from app.models.user import User

SECOND_USER_DATA = {
    "email": "second@predictax.com",
    "username": "seconduser",
    "password": "securepass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}


def _register_second_user(client: TestClient) -> dict[str, str]:
    response = client.post("/api/auth/register", json=SECOND_USER_DATA)
    assert response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": SECOND_USER_DATA["email"],
            "password": SECOND_USER_DATA["password"],
        },
    )
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def test_create_prediction_requires_auth(client: TestClient, sample_market):
    response = client.post(
        "/api/predictions",
        json={
            "market_id": str(sample_market.id),
            "probability": 65,
            "points_wagered": 100,
        },
    )

    assert response.status_code == 403


def test_create_prediction_records_vote_and_updates_points(
    client: TestClient,
    db,
    user_headers,
    sample_market,
):
    user = db.query(User).filter(User.email == "test@predictax.com").first()

    response = client.post(
        "/api/predictions",
        headers=user_headers,
        json={
            "market_id": str(sample_market.id),
            "probability": 70,
            "points_wagered": 100,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"]
    assert data["user_id"] == str(user.id)
    assert data["market_id"] == str(sample_market.id)
    assert data["probability"] == 70
    assert data["points_wagered"] == 100
    assert data["potential_gain"] == 30
    assert data["status"] == "pending"

    db.refresh(user)
    db.refresh(sample_market)
    assert user.points == 900
    assert sample_market.volume == 100
    assert sample_market.participants_count == 1


def test_create_prediction_rejects_excessive_points(
    client: TestClient,
    user_headers,
    sample_market,
):
    response = client.post(
        "/api/predictions",
        headers=user_headers,
        json={
            "market_id": str(sample_market.id),
            "probability": 65,
            "points_wagered": 10001,
        },
    )

    assert response.status_code == 422


def test_user_predictions_are_scoped_to_current_user(
    client: TestClient,
    db,
    user_headers,
    sample_market,
):
    first_user = db.query(User).filter(User.email == "test@predictax.com").first()
    second_headers = _register_second_user(client)
    prediction = Prediction(
        user_id=first_user.id,
        market_id=sample_market.id,
        probability=60,
        points_wagered=50,
        potential_gain=20,
    )
    db.add(prediction)
    db.commit()

    first_response = client.get("/api/predictions", headers=user_headers)
    second_response = client.get("/api/predictions", headers=second_headers)

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert [item["user_id"] for item in first_response.json()] == [str(first_user.id)]
    assert second_response.json() == []


def test_public_market_predictions_do_not_expose_user_ids(
    client: TestClient,
    db,
    user_headers,
    sample_market,
):
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    prediction = Prediction(
        user_id=user.id,
        market_id=sample_market.id,
        probability=60,
        points_wagered=50,
        potential_gain=20,
    )
    db.add(prediction)
    db.commit()

    response = client.get(f"/api/predictions/market/{sample_market.id}", headers=user_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "user_id" not in data[0]
    assert data[0]["market_id"] == str(sample_market.id)
