"""Payout tests for issue #275 — the divisor must follow the side actually bet."""

import pytest
from fastapi.testclient import TestClient

from app.models.user import User


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


def _unresolve(client, headers, market_id):
    return client.post(f"/api/admin/markets/{market_id}/unresolve", headers=headers)


def _set_market_probability(db, market, probability: float):
    market.probability_market = probability
    db.commit()
    db.refresh(market)


def test_no_bet_wins_pays_with_complement_probability(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Apuesta NO en un mercado al 55% → payout usa (100-55), no 55."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=25, points=100)
    assert res.status_code == 201
    _resolve(client, admin_headers, sample_market.id, resolution_value=False)

    db.refresh(user)
    # payout = 100 / ((100-55)/100) = 222.22, no 100 / (55/100) = 181.82
    assert user.points == pytest.approx(points_before - 100 + 222.22, abs=0.01)


def test_yes_bet_payout_is_finite_at_zero_probability(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Mercado al 0% → el SÍ cobra con la probabilidad clampeada a 1%, no infinito."""
    _set_market_probability(db, sample_market, 0.0)
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=75, points=100)
    assert res.status_code == 201
    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    # payout = 100 / (1/100) = 10000 (clamp inferior), nunca división por cero
    assert user.points == pytest.approx(points_before - 100 + 10000.0, abs=0.01)


def test_no_bet_payout_is_finite_at_full_probability(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Mercado al 100% → el NO cobra con la probabilidad clampeada a 99%, no infinito."""
    _set_market_probability(db, sample_market, 100.0)
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=25, points=100)
    assert res.status_code == 201
    _resolve(client, admin_headers, sample_market.id, resolution_value=False)

    db.refresh(user)
    # payout = 100 / ((100-99)/100) = 10000 (clamp superior)
    assert user.points == pytest.approx(points_before - 100 + 10000.0, abs=0.01)


def _run_both_sides_attack(client, user_headers, market_id):
    """Ataque del issue #275: hundir la probabilidad y después apostar a los dos lados.

    Devuelve el total apostado.
    """
    # 1-2. Empujar el mercado a ~1% con apuestas chicas
    res = _bet(client, user_headers, market_id, probability=25, points=99)
    assert res.status_code == 201
    res = _bet(client, user_headers, market_id, probability=75, points=1)
    assert res.status_code == 201
    # 3. Apostar el mismo monto a los dos lados
    res = _bet(client, user_headers, market_id, probability=25, points=400)
    assert res.status_code == 201
    res = _bet(client, user_headers, market_id, probability=75, points=400)
    assert res.status_code == 201
    return 99 + 1 + 400 + 400


def test_both_sides_arbitrage_loses_when_market_resolves_no(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Con el divisor por lado, apostar a los dos lados ya no paga en cualquier resolución."""
    _set_market_probability(db, sample_market, 50.0)
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    staked = _run_both_sides_attack(client, user_headers, sample_market.id)
    _resolve(client, admin_headers, sample_market.id, resolution_value=False)

    db.refresh(user)
    # Antes del fix los NO cobraban 400 / (1/100) = 40000 y el ataque era gratis.
    assert user.points < points_before
    assert user.points - (points_before - staked) < staked


@pytest.mark.xfail(
    reason=(
        "Residual de #275: probability_at_bet se captura antes de la propia apuesta, "
        "así que el atacante todavía puede hundir el mercado a ~1% y tomar una "
        "posición grande a esas cuotas viejas. El clamp acota el múltiplo a 100x "
        "pero no cierra el agujero; requiere cambiar cómo se fija el precio de la apuesta."
    )
)
def test_both_sides_arbitrage_loses_when_market_resolves_yes(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """El mismo ataque resuelto en YES: todavía acuña puntos."""
    _set_market_probability(db, sample_market, 50.0)
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    _run_both_sides_attack(client, user_headers, sample_market.id)
    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    assert user.points < points_before


def test_resolve_then_unresolve_restores_every_balance(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """resolve + unresolve deja cada saldo exactamente como estaba."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    admin = db.query(User).filter(User.email == "admin-test@predictax.com").first()

    res = _bet(client, user_headers, sample_market.id, probability=75, points=100)
    assert res.status_code == 201
    res = _bet(client, admin_headers, sample_market.id, probability=25, points=200)
    assert res.status_code == 201

    db.refresh(user)
    db.refresh(admin)
    user_points_after_bets = user.points
    admin_points_after_bets = admin.points

    _resolve(client, admin_headers, sample_market.id, resolution_value=False)
    _unresolve(client, admin_headers, sample_market.id)

    db.refresh(user)
    db.refresh(admin)
    assert user.points == user_points_after_bets
    assert admin.points == admin_points_after_bets

    predictions = client.get("/api/predictions", headers=user_headers).json()
    assert all(p["status"] == "pending" for p in predictions)
