import pytest
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
    # payout = 100 / (55/100) = 181.82; potential_gain = payout - stake = 81.82
    assert data["potential_gain"] == pytest.approx(81.82, abs=0.01)
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


# ── YES / NO flow tests (issue #200) ──────────────────────────────────────────

def _bet(client, headers, market_id, probability, points=100):
    return client.post(
        "/api/predictions",
        headers=headers,
        json={"market_id": str(market_id), "probability": probability, "points_wagered": points},
    )


def _resolve(client, headers, market_id, resolution_value: bool):
    return client.post(
        f"/api/admin/markets/{market_id}/resolve",
        headers=headers,
        json={"resolution_value": resolution_value, "resolution_note": "test"},
    )


def test_prediction_yes_wins(client, db, user_headers, admin_headers, sample_market):
    """Apuesta SÍ (probability=75), mercado resuelve YES → usuario gana, saldo sube."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=75, points=100)
    assert res.status_code == 201

    db.refresh(user)
    assert user.points == points_before - 100  # puntos descontados al apostar

    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    # payout = 100 / (55/100) = 181.82
    assert user.points == pytest.approx(points_before - 100 + 181.82, abs=0.5)


def test_prediction_yes_loses(client, db, user_headers, admin_headers, sample_market):
    """Apuesta SÍ (probability=75), mercado resuelve NO → usuario pierde."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=75, points=100)
    assert res.status_code == 201

    _resolve(client, admin_headers, sample_market.id, resolution_value=False)

    db.refresh(user)
    assert user.points == pytest.approx(points_before - 100, abs=0.01)


def test_prediction_no_wins(client, db, user_headers, admin_headers, sample_market):
    """Apuesta NO (probability=25), mercado resuelve NO → usuario gana."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=25, points=100)
    assert res.status_code == 201

    _resolve(client, admin_headers, sample_market.id, resolution_value=False)

    db.refresh(user)
    # payout = 100 / (55/100) = 181.82
    assert user.points == pytest.approx(points_before - 100 + 181.82, abs=0.5)


def test_prediction_no_loses(client, db, user_headers, admin_headers, sample_market):
    """Apuesta NO (probability=25), mercado resuelve YES → usuario pierde."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=25, points=100)
    assert res.status_code == 201

    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    assert user.points == pytest.approx(points_before - 100, abs=0.01)


def test_prediction_50_rejected(client, user_headers, sample_market):
    """POST con probability=50 debe devolver HTTP 422."""
    res = _bet(client, user_headers, sample_market.id, probability=50, points=100)
    assert res.status_code == 422
    assert "50" in res.json()["detail"][0]["msg"]


def test_payout_calculation(client, db, user_headers, sample_market):
    """Verifica que potential_gain = stake / (prob_market/100) - stake."""
    res = _bet(client, user_headers, sample_market.id, probability=75, points=200)
    assert res.status_code == 201
    data = res.json()
    # sample_market.probability_market = 55.0
    expected_gain = 200 / (55.0 / 100) - 200  # = 163.64
    assert data["potential_gain"] == pytest.approx(expected_gain, abs=0.01)
