"""Regressions for the pre-demo backend scan.

Covers the two money-visible bugs (referral link domain, inflated profile
gains), the market listing order, and the Gemini model fallback chain.
"""

import pytest
from fastapi.testclient import TestClient
from google.genai import errors

from app.config import Settings, settings
from app.models.prediction import Prediction
from app.models.user import User
from app.services import ai_service, chatbot_service, prediction_service

REFERRAL_URL = "/api/users/me/referral"
PROFILE_URL = "/api/users/me/profile"


# --------------- Referral link domain ---------------


def test_referral_link_uses_configured_base_url(client: TestClient, user_headers):
    """The link must come from CANONICAL_BASE_URL, not a hardcoded domain.

    Production shipped https://neuropredict.com, a domain that does not
    exist, so every referral link any user shared was dead.
    """
    data = client.get(REFERRAL_URL, headers=user_headers).json()

    assert data["referral_link"].startswith(settings.CANONICAL_BASE_URL)
    assert data["referral_link"] == (
        f"{settings.CANONICAL_BASE_URL}/auth?ref={data['referral_code']}"
    )
    assert "neuropredict.com/" not in data["referral_link"]


def test_referral_link_follows_base_url_override(client: TestClient, user_headers, monkeypatch):
    monkeypatch.setattr(settings, "CANONICAL_BASE_URL", "https://staging.example.org/")

    data = client.get(REFERRAL_URL, headers=user_headers).json()

    assert data["referral_link"] == (
        f"https://staging.example.org/auth?ref={data['referral_code']}"
    )


def test_default_base_url_is_the_live_site():
    assert Settings.model_fields["CANONICAL_BASE_URL"].default == "https://www.neuropredict.io"


# --------------- Profile gains ---------------


def _won_prediction(db, user, market, probability, points_wagered, probability_at_bet):
    prediction = Prediction(
        user_id=user.id,
        market_id=market.id,
        probability=probability,
        points_wagered=points_wagered,
        probability_at_bet=probability_at_bet,
        status="won",
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def test_total_won_is_net_gain_for_both_bet_sides(
    client: TestClient, db, registered_user, user_headers, sample_market
):
    """total_won == sum(calculate_payout) - stakes, with the per-side divisor.

    The old expression returned the gross payout (stake included) computed
    with the YES probability for both sides.
    """
    user = db.query(User).filter(User.id == registered_user["id"]).first()
    yes_bet = _won_prediction(db, user, sample_market, 75.0, 100.0, 60.0)
    no_bet = _won_prediction(db, user, sample_market, 25.0, 200.0, 80.0)

    expected = sum(
        prediction_service.calculate_payout(p.points_wagered, p.probability_at_bet, p.probability)
        - p.points_wagered
        for p in (yes_bet, no_bet)
    )

    stats = client.get(PROFILE_URL, headers=user_headers).json()["stats"]

    assert stats["total_won"] == pytest.approx(round(expected, 2), abs=0.01)
    # Gross would have been expected + 300 (the two stakes).
    assert stats["total_won"] < expected + 300
    assert stats["net"] == pytest.approx(
        round(stats["total_won"] - stats["total_lost"], 2), abs=0.01
    )


def test_winning_no_bet_at_extreme_probability_does_not_inflate_gains(
    client: TestClient, db, registered_user, user_headers, sample_market
):
    """A winning NO bet priced at 1% YES collects at ~99% odds, not ~1%.

    This is the ~90x case: the old expression divided by the YES probability
    (1) instead of its complement (99) and kept the stake in the total, so a
    1.01 pt gain was reported as 9900.
    """
    user = db.query(User).filter(User.id == registered_user["id"]).first()
    _won_prediction(db, user, sample_market, 25.0, 100.0, 1.0)

    # payout = 100 / ((100-1)/100) = 101.01 -> net gain 1.01
    stats = client.get(PROFILE_URL, headers=user_headers).json()["stats"]

    assert stats["total_won"] == pytest.approx(1.01, abs=0.01)
    # The buggy expression paid 100 / (1/100) - 100 = 9900 on this same row.
    assert stats["total_won"] < 10


def test_admin_user_stats_match_profile_gains(
    client: TestClient, db, registered_user, user_headers, admin_headers, sample_market
):
    """The admin display stats use the same net-gain helper as the profile."""
    user = db.query(User).filter(User.id == registered_user["id"]).first()
    _won_prediction(db, user, sample_market, 25.0, 100.0, 1.0)
    _won_prediction(db, user, sample_market, 75.0, 50.0, 40.0)

    profile = client.get(PROFILE_URL, headers=user_headers).json()["stats"]
    admin_stats = client.get(
        f"/api/admin/users/{user.id}/stats", headers=admin_headers
    ).json()

    assert admin_stats["points_won"] == pytest.approx(profile["total_won"], abs=0.01)
    assert admin_stats["net"] == pytest.approx(profile["net"], abs=0.01)


def test_winning_net_gain_matches_stored_potential_gain(
    client: TestClient, db, user_headers, sample_market
):
    """A real bet's potential_gain and winning_net_gain cannot drift apart."""
    response = client.post(
        "/api/predictions",
        headers=user_headers,
        json={
            "market_id": str(sample_market.id),
            "probability": 25,
            "points_wagered": 150,
        },
    )
    assert response.status_code == 201

    prediction = db.query(Prediction).filter(Prediction.market_id == sample_market.id).one()

    assert prediction_service.winning_net_gain(prediction) == pytest.approx(
        prediction.potential_gain, abs=0.01
    )


# --------------- Market listing order ---------------


def test_list_markets_returns_highest_volume_first(client: TestClient, sample_markets):
    """Ordering by created_at put the empty markets on the first page.

    MarketResponse.volume is a formatted string ("15.1K pts"), so the order is
    checked against the fixture volumes read from the DB.
    """
    volume_by_title = {m.title: m.volume for m in sample_markets}
    titles = [m["title"] for m in client.get("/api/markets").json()]

    listed = [volume_by_title[t] for t in titles if t in volume_by_title]
    assert listed == sorted(volume_by_title.values(), reverse=True)
    assert titles[0] == "Dolar blue > 1500?"  # 15000 pts, the busiest fixture


def test_list_markets_puts_empty_market_last(client: TestClient, db, sample_markets):
    """A market with 0 volume and 0 participants must not lead the listing."""
    from datetime import datetime, timedelta, timezone

    from app.models.market import Market, MarketCategory, MarketStatus, MarketType

    empty = Market(
        title="Brand new market with no bets",
        description="No predictions yet.",
        category=MarketCategory.ECONOMIA,
        type=MarketType.BINARY,
        probability_market=50.0,
        volume=0,
        participants_count=0,
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=MarketStatus.ACTIVE,
    )
    db.add(empty)
    db.commit()

    titles = [m["title"] for m in client.get("/api/markets").json()]

    assert titles[0] != empty.title
    assert titles[-1] == empty.title


# --------------- Gemini model fallback ---------------


def _fake_response(text: str = "ok"):
    class _Response:
        function_calls = None
        usage_metadata = None

        def __init__(self, text):
            self.text = text

    return _Response(text)


class _FakeModels:
    """Records the models asked for and fails the ones told to fail."""

    def __init__(self, failures: dict[str, Exception]):
        self.failures = failures
        self.calls: list[str] = []

    def generate_content(self, model, **_kwargs):
        self.calls.append(model)
        if model in self.failures:
            raise self.failures[model]
        return _fake_response()


class _FakeClient:
    def __init__(self, failures: dict[str, Exception]):
        self.models = _FakeModels(failures)


def _unavailable_error() -> Exception:
    return errors.ServerError(
        503, {"error": {"code": 503, "status": "UNAVAILABLE", "message": "high demand"}}
    )


def _quota_error() -> Exception:
    return errors.ClientError(
        429,
        {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "message": "quota exceeded"}},
    )


def test_resolved_model_is_reported_not_the_alias():
    """With an alias, ai_usage_log must record the version behind it.

    gemini-flash-latest resolves to whatever the current model is; logging the
    alias would make the usage history useless for correlating output quality
    or cost with an actual model.
    """

    class _Response:
        model_version = "gemini-3.8-flash"

    class _Models:
        def generate_content(self, model, **kwargs):
            return _Response()

    class _Client:
        models = _Models()

    _, answered = ai_service.generate_with_fallback(
        _Client(), "gemini-flash-latest", contents="hola"
    )

    assert answered == "gemini-3.8-flash"


def test_requested_model_is_reported_when_no_version_is_returned():
    """Older or stubbed responses carry no model_version; fall back to the name."""

    class _Response:
        pass

    class _Models:
        def generate_content(self, model, **kwargs):
            return _Response()

    class _Client:
        models = _Models()

    _, answered = ai_service.generate_with_fallback(
        _Client(), "gemini-3.8-flash", contents="hola"
    )

    assert answered == "gemini-3.8-flash"


def test_model_chain_starts_with_the_configured_model():
    chain = ai_service.get_model_chain("gemini-3.6-flash")

    assert chain[0] == "gemini-3.6-flash"
    assert chain[1:] == list(settings.GEMINI_FALLBACK_MODELS)


def test_model_chain_does_not_repeat_the_primary(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-x", "gemini-y"])

    assert ai_service.get_model_chain("gemini-x") == ["gemini-x", "gemini-y"]


def test_fallback_retries_next_model_on_503(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-lite", "gemini-old"])
    fake = _FakeClient({"gemini-broken": _unavailable_error()})

    response, model = ai_service.generate_with_fallback(fake, "gemini-broken", contents="hi")

    assert model == "gemini-lite"
    assert response.text == "ok"
    assert fake.models.calls == ["gemini-broken", "gemini-lite"]


def test_fallback_does_not_retry_on_429_quota(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-lite"])
    fake = _FakeClient({"gemini-broken": _quota_error()})

    with pytest.raises(errors.ClientError):
        ai_service.generate_with_fallback(fake, "gemini-broken", contents="hi")

    # Every model shares the same quota, so burning a second call is pointless.
    assert fake.models.calls == ["gemini-broken"]


def test_fallback_raises_when_the_whole_chain_is_unavailable(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-lite"])
    fake = _FakeClient(
        {"gemini-broken": _unavailable_error(), "gemini-lite": _unavailable_error()}
    )

    with pytest.raises(errors.ServerError):
        ai_service.generate_with_fallback(fake, "gemini-broken", contents="hi")

    assert fake.models.calls == ["gemini-broken", "gemini-lite"]


def test_chatbot_falls_back_and_logs_the_model_that_answered(db, monkeypatch):
    """ai_usage_log.model must name the model that ran, not the configured one."""
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-broken")
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-lite"])
    fake = _FakeClient({"gemini-broken": _unavailable_error()})
    monkeypatch.setattr(chatbot_service, "gemini_client", fake)

    logged: list[dict] = []
    monkeypatch.setattr(chatbot_service, "_log_usage", lambda **kwargs: logged.append(kwargs))
    monkeypatch.setattr(chatbot_service, "_check_daily_quota", lambda: None)
    monkeypatch.setattr(chatbot_service, "_increment_daily_quota", lambda: None)
    monkeypatch.setattr(chatbot_service, "check_chatbot_rate_limit", lambda _requester: None)

    reply = chatbot_service.send_message(db, "hola", [], user=None)

    assert reply == "ok"
    assert fake.models.calls == ["gemini-broken", "gemini-lite"]
    assert [entry["model"] for entry in logged] == ["gemini-lite"]


def test_analysis_logs_the_fallback_model(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-broken")
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-lite"])
    fake = _FakeClient({"gemini-broken": _unavailable_error()})
    fake.models.generate_content = _json_analysis_generator(fake.models)
    monkeypatch.setattr(ai_service, "gemini_client", fake)

    logged: list[dict] = []
    monkeypatch.setattr(ai_service, "_log_usage", lambda **kwargs: logged.append(kwargs))
    monkeypatch.setattr(ai_service, "_increment_daily_quota", lambda: None)
    monkeypatch.setattr(ai_service, "get_daily_usage_count", lambda: 0)

    result = ai_service.analyze_market({"id": "m1", "title": "T"})

    assert result["probability"] == 42
    assert [entry["model"] for entry in logged] == ["gemini-lite"]


def _json_analysis_generator(models: _FakeModels):
    """generate_content stub returning the JSON payload analyze_market parses."""
    original = models.generate_content

    def generate_content(model, **kwargs):
        original(model, **kwargs)
        return _fake_response(
            '{"probability": 42, "confidence": "low", "reasoning": "r", '
            '"key_factors": [], "risks": []}'
        )

    return generate_content
