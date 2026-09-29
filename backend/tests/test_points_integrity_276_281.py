"""Points economy integrity tests for #276 (race on the balance) and #281
(cancel/expire confiscating stakes, unresolve going negative)."""

import threading
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import InsufficientPointsException
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.market_snapshot import MarketSnapshot
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreate
from app.services import prediction_service


def _bet(client, headers, market_id, probability=75, points=100):
    return client.post(
        "/api/predictions",
        headers=headers,
        json={
            "market_id": str(market_id),
            "probability": probability,
            "points_wagered": points,
        },
    )


def _test_user(db):
    return db.query(User).filter(User.email == "test@predictax.com").first()


def _add_participant(db, market, username, points_left, points_wagered):
    """A second participant with a bet already placed (points already debited)."""
    user = User(
        email=f"{username}@predictax.com",
        username=username,
        hashed_password="not-a-real-hash",
        points=points_left,
        email_verified=True,
    )
    db.add(user)
    db.flush()
    db.add(
        Prediction(
            user_id=user.id,
            market_id=market.id,
            probability=25,
            probability_at_bet=55.0,
            points_wagered=points_wagered,
            potential_gain=0.0,
        )
    )
    db.commit()
    return user


# --------------- #276: balance race and the non-negative floor ---------------

def test_concurrent_bets_for_the_full_balance_only_one_succeeds(db):
    """Dos apuestas simultáneas por el saldo completo: solo una entra.

    Needs real concurrent transactions, so it opens its own committed sessions
    instead of the shared rollback session the `db` fixture hands out (rows in
    that transaction are invisible to any other connection).
    """
    from tests.conftest import TestingSessionLocal

    setup = TestingSessionLocal()
    user = User(
        email="race276@predictax.com",
        username="race276",
        hashed_password="not-a-real-hash",
        points=1000.0,
        email_verified=True,
    )
    market = Market(
        title="Race test market",
        description="Concurrent bets against the same balance",
        category=MarketCategory.CRYPTO,
        type=MarketType.BINARY,
        probability_market=50.0,
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=MarketStatus.ACTIVE,
    )
    setup.add_all([user, market])
    setup.commit()
    user_id, market_id = user.id, market.id
    setup.close()

    barrier = threading.Barrier(2)
    results = []

    def place_bet():
        session = TestingSessionLocal()
        try:
            bettor = session.query(User).filter(User.id == user_id).one()
            barrier.wait(timeout=10)
            prediction_service.create_prediction(
                session,
                bettor,
                PredictionCreate(market_id=market_id, probability=75, points_wagered=1000),
            )
            results.append("accepted")
        except InsufficientPointsException:
            results.append("rejected")
        except Exception as exc:  # surfaced in the assert below
            results.append(f"error: {exc!r}")
        finally:
            session.close()

    threads = [threading.Thread(target=place_bet) for _ in range(2)]
    try:
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        check = TestingSessionLocal()
        final_points = check.query(User).filter(User.id == user_id).one().points
        bets = check.query(Prediction).filter(Prediction.market_id == market_id).count()
        check.close()

        assert sorted(results) == ["accepted", "rejected"], results
        assert bets == 1
        assert final_points == 0.0
    finally:
        cleanup = TestingSessionLocal()
        cleanup.query(Prediction).filter(Prediction.market_id == market_id).delete()
        cleanup.query(MarketSnapshot).filter(
            MarketSnapshot.market_id == market_id
        ).delete()
        cleanup.query(Market).filter(Market.id == market_id).delete()
        cleanup.query(User).filter(User.id == user_id).delete()
        cleanup.commit()
        cleanup.close()


def test_sequential_bets_cannot_drive_points_below_zero(
    client: TestClient, db, user_headers, sample_market
):
    """Gastado todo el saldo, la siguiente apuesta se rechaza y el saldo queda en 0."""
    assert _bet(client, user_headers, sample_market.id, points=1000).status_code == 201

    user = _test_user(db)
    db.refresh(user)
    assert user.points == 0

    res = _bet(client, user_headers, sample_market.id, points=1)
    assert res.status_code == 400
    db.refresh(user)
    assert user.points == 0


def test_admin_cannot_set_a_negative_balance(
    client: TestClient, db, admin_headers, registered_user, user_headers
):
    """El ajuste manual de puntos no puede dejar el saldo negativo."""
    user = _test_user(db)
    res = client.patch(
        f"/api/admin/users/{user.id}/points",
        headers=admin_headers,
        json={"points": -500, "reason": "test"},
    )
    assert res.status_code == 422
    db.refresh(user)
    assert user.points >= 0


# --------------- #281: cancel / expire refund instead of confiscating --------

def test_cancel_market_refunds_every_participant(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Cancelar un mercado con apuestas abiertas devuelve el saldo exacto a cada uno."""
    assert _bet(client, user_headers, sample_market.id, points=300).status_code == 201
    other = _add_participant(db, sample_market, "other276", points_left=500.0, points_wagered=200)

    user = _test_user(db)
    db.refresh(user)
    assert user.points == 700

    res = client.post(
        f"/api/admin/markets/{sample_market.id}/cancel", headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["refunded_predictions"] == 2
    assert res.json()["points_refunded"] == 500.0

    db.refresh(user)
    db.refresh(other)
    assert user.points == 1000.0
    assert other.points == 700.0

    statuses = {
        p.status
        for p in db.query(Prediction).filter(Prediction.market_id == sample_market.id)
    }
    assert statuses == {"refunded"}


def test_expire_past_refunds_instead_of_confiscating(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """El vencimiento normal de un mercado devuelve lo apostado, no lo confisca."""
    assert _bet(client, user_headers, sample_market.id, points=250).status_code == 201

    sample_market.end_date = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()

    res = client.post("/api/admin/markets/expire-past", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["expired"] >= 1
    assert res.json()["points_refunded"] == 250.0

    user = _test_user(db)
    db.refresh(user)
    db.refresh(sample_market)
    assert user.points == 1000.0
    assert sample_market.status == MarketStatus.CANCELLED


def test_cancelling_twice_does_not_refund_twice(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Un mercado ya cancelado no vuelve a pagar: el refund solo toca `pending`."""
    assert _bet(client, user_headers, sample_market.id, points=100).status_code == 201
    client.post(f"/api/admin/markets/{sample_market.id}/cancel", headers=admin_headers)

    again = client.post(
        f"/api/admin/markets/{sample_market.id}/cancel", headers=admin_headers
    )
    assert again.status_code == 400

    user = _test_user(db)
    db.refresh(user)
    assert user.points == 1000.0


def test_delete_market_with_predictions_is_blocked(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Borrar un mercado con apuestas destruye el registro: se bloquea."""
    assert _bet(client, user_headers, sample_market.id, points=100).status_code == 201

    res = client.delete(
        f"/api/admin/markets/{sample_market.id}", headers=admin_headers
    )
    assert res.status_code == 409

    assert db.query(Prediction).filter(Prediction.market_id == sample_market.id).count() == 1
    user = _test_user(db)
    db.refresh(user)
    assert user.points == 900.0


def test_delete_market_without_predictions_still_works(
    client: TestClient, db, admin_headers, sample_market
):
    """Sin apuestas no hay nada que preservar, el borrado sigue disponible."""
    res = client.delete(
        f"/api/admin/markets/{sample_market.id}", headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["deleted"] is True


# --------------- #281: unresolve must not go negative ------------------------

def test_unresolve_never_produces_a_negative_balance(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Si el ganador ya gastó lo cobrado, el unresolve recupera lo que queda y perdona el resto."""
    assert _bet(client, user_headers, sample_market.id, points=100).status_code == 201
    assert client.post(
        f"/api/admin/markets/{sample_market.id}/resolve",
        headers=admin_headers,
        json={"resolution_value": True},
    ).status_code == 200

    user = _test_user(db)
    db.refresh(user)
    # payout = 100 / (55/100) = 181.82
    payout = pytest.approx(1000 - 100 + 181.82, abs=0.01)
    assert user.points == payout

    # The winner re-wagers almost everything elsewhere: only 10 pts left to claw back.
    client.patch(
        f"/api/admin/users/{user.id}/points",
        headers=admin_headers,
        json={"points": 10, "reason": "spent the winnings"},
    )

    res = client.post(
        f"/api/admin/markets/{sample_market.id}/unresolve", headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["points_adjusted"] == 10.0
    assert res.json()["points_forgiven"] == pytest.approx(171.82, abs=0.01)

    db.refresh(user)
    assert user.points == 0.0


def test_unresolve_claws_back_the_full_payout_when_the_user_still_has_it(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """El caso normal no cambia: si el saldo alcanza, se devuelve el payout completo."""
    assert _bet(client, user_headers, sample_market.id, points=100).status_code == 201
    client.post(
        f"/api/admin/markets/{sample_market.id}/resolve",
        headers=admin_headers,
        json={"resolution_value": True},
    )

    res = client.post(
        f"/api/admin/markets/{sample_market.id}/unresolve", headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["points_forgiven"] == 0.0

    user = _test_user(db)
    db.refresh(user)
    assert user.points == 900.0
