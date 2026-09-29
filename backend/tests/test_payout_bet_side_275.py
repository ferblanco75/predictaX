"""Payout tests for issue #275 — the divisor must follow the side actually bet."""

import pytest
from fastapi.testclient import TestClient

from app.models.prediction import Prediction
from app.models.user import User
from app.services.prediction_service import calculate_payout


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


# #306: probability_at_bet ahora se fija al precio POST-trade (después de la propia
# apuesta), no al precio de mercado antes de apostar — por diseño, ya no se puede
# mutar probability_market a mano y esperar que una sola apuesta HTTP se cobre a ese
# precio (la propia apuesta recalcula el mercado antes de fijar su precio). Los 3
# tests de abajo verificaban la fórmula de calculate_payout (complemento por lado,
# clamp en los extremos) simulando ese precio vía HTTP; ahora la testean
# directamente como unit tests de la función, que es lo que realmente ejercían.
def test_no_bet_wins_pays_with_complement_probability():
    """Apuesta NO en un mercado al 55% → payout usa (100-55), no 55."""
    payout = calculate_payout(points_wagered=100, probability_at_bet=55.0, bet_probability=25)
    # payout = 100 / ((100-55)/100) = 222.22, no 100 / (55/100) = 181.82
    assert payout == pytest.approx(222.22, abs=0.01)


def test_yes_bet_payout_is_finite_at_zero_probability():
    """Mercado al 0% → el SÍ cobra al clamp de 1% (100x), no un múltiplo ilimitado.

    Antes de #275 el 0.0 era falsy y caía al fallback de 50 (2x). Ese reprecio afecta
    solo a las apuestas nuevas: las filas que ya tenían 0.0 las reescribe a 50.0 la
    migración d1e2f3a4b5c6, así que ninguna apuesta ya registrada cambia de valor.
    """
    payout = calculate_payout(points_wagered=100, probability_at_bet=0.0, bet_probability=75)
    # payout = 100 / (1/100) = 10000 (clamp inferior), acotado en vez de ilimitado
    assert payout == pytest.approx(10000.0, abs=0.01)


def test_no_bet_payout_is_finite_at_full_probability():
    """Mercado al 100% → el NO cobra con la probabilidad clampeada a 99%, no infinito."""
    payout = calculate_payout(points_wagered=100, probability_at_bet=100.0, bet_probability=25)
    # payout = 100 / ((100-99)/100) = 10000 (clamp superior)
    assert payout == pytest.approx(10000.0, abs=0.01)


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


def test_both_sides_arbitrage_yes_leaves_only_a_small_residual(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """El mismo ataque resuelto en YES, con precio post-trade (#306).

    El fix acota drásticamente el arbitraje (de 40.000 sobre 900 apostados a un
    residuo de bajo valor absoluto) pero no lo elimina matemáticamente para un
    atacante que es el ÚNICO apostador del mercado: la última apuesta al SÍ
    (400 pts en un pool que hasta ese momento tenía ~500 pts) se fija a un precio
    post-trade que promedia su propio impacto con el estado previo, así que se
    paga algo más barato que el precio final que ella misma generó. Con volumen
    real de otros apostadores este margen se diluye; en un mercado nuevo con un
    solo participante queda un residuo de bajo valor absoluto — el propio issue
    #306 señala el modelo parimutuel como la forma de cerrarlo por completo, a
    costo de una reescritura mayor fuera de alcance de este fix.
    """
    _set_market_probability(db, sample_market, 50.0)
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    _run_both_sides_attack(client, user_headers, sample_market.id)
    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    # Antes del fix el ataque pagaba ~40.000 sobre 900 apostados (arbitraje masivo).
    # Con precio post-trade queda acotado a un residuo chico en términos absolutos.
    assert user.points - points_before < 200


def test_self_arbitrage_via_two_step_bet_no_longer_mints_points(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Escenario exacto del issue #306: hundir el mercado con una apuesta chica al NO
    y apostar fuerte al SÍ ya no cobra a la cuota vieja que el propio usuario generó.

    Antes del fix (#306), probability_at_bet se fijaba con el precio ANTES de la
    propia apuesta: 1 pt al NO hundía el mercado a ~1%, y los 999 pts al SÍ se
    pagaban como si el mercado siguiera al 1% (payout ~99.900 sobre 1.000
    apostados). Con el precio post-trade, la apuesta de 999 se fija al ~99.9% que
    ESA MISMA apuesta genera, así que el payout queda acotado a lo que el mercado
    realmente refleja tras la apuesta (~1.009), no a la cuota que el usuario se
    fabricó con el paso previo.
    """
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=25, points=1)
    assert res.status_code == 201
    res = _bet(client, user_headers, sample_market.id, probability=75, points=999)
    assert res.status_code == 201

    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    # payout post-trade: yes_prob = 999/1000*100 = 99.9 -> 999 / (99.9/100) = 1000.0009 ≈ 1000
    # (el NO de 1 pt pierde, así que el resultado neto es el payout del SÍ menos el
    # total apostado en ambas apuestas)
    assert user.points == pytest.approx(points_before - 1000 + 1009.09, abs=1.0)
    # El bug original hubiera pagado ~99.900 — confirmar que queda muy por debajo.
    assert user.points < points_before + 5000


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


def test_legacy_prediction_without_probability_at_bet_pays_1_to_1(
    client: TestClient, db, user_headers, admin_headers, sample_market
):
    """Predicción vieja sin probability_at_bet → sigue cobrando al fallback de 50 (2x)."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    points_before = user.points

    res = _bet(client, user_headers, sample_market.id, probability=75, points=100)
    assert res.status_code == 201

    prediction = db.query(Prediction).filter(Prediction.user_id == user.id).one()
    prediction.probability_at_bet = None
    db.commit()

    _resolve(client, admin_headers, sample_market.id, resolution_value=True)

    db.refresh(user)
    # payout = 100 / (50/100) = 200
    assert user.points == pytest.approx(points_before - 100 + 200.0, abs=0.01)
