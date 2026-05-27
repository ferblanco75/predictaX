from datetime import datetime, timedelta, timezone

import pytest

from app.models.ai_usage_log import AIUsageLog
from app.services import ai_service


class SessionProxy:
    def __init__(self, db):
        self.db = db

    def query(self, *args, **kwargs):
        return self.db.query(*args, **kwargs)

    def close(self):
        pass


class RedisStub:
    def __init__(self, value=None):
        self.value = value
        self.store = {}
        self.expirations = {}

    def get(self, key):
        return self.store.get(key, self.value)

    def incr(self, key):
        self.store[key] = str(int(self.store.get(key, 0)) + 1)
        return int(self.store[key])

    def expire(self, key, seconds):
        self.expirations[key] = seconds

    def set(self, key, value, ex=None, nx=False):
        if nx and key in self.store:
            return None
        self.store[key] = value
        if ex is not None:
            self.expirations[key] = ex
        return True

    def setex(self, key, seconds, value):
        self.store[key] = value
        self.expirations[key] = seconds

    def delete(self, key):
        self.store.pop(key, None)


def _add_ai_usage(db, *, cache_hit=False, status="success", created_at=None):
    log = AIUsageLog(
        provider="gemini",
        model="gemini-test",
        cache_hit=cache_hit,
        status=status,
        created_at=created_at or datetime.now(timezone.utc),
    )
    db.add(log)
    db.flush()
    return log


def test_daily_usage_count_uses_db_when_redis_missing(db, monkeypatch):
    _add_ai_usage(db)
    _add_ai_usage(db)
    _add_ai_usage(db, cache_hit=True)
    _add_ai_usage(db, status="error")
    _add_ai_usage(db, created_at=datetime.now(timezone.utc) - timedelta(days=1))

    monkeypatch.setattr(ai_service, "redis_client", None)
    monkeypatch.setattr(ai_service, "SessionLocal", lambda: SessionProxy(db))

    assert ai_service.get_daily_usage_count() == 2


def test_daily_usage_count_prefers_redis_when_key_exists(db, monkeypatch):
    _add_ai_usage(db)

    monkeypatch.setattr(ai_service, "redis_client", RedisStub("7"))
    monkeypatch.setattr(ai_service, "SessionLocal", lambda: SessionProxy(db))

    assert ai_service.get_daily_usage_count() == 7


def test_daily_usage_count_uses_db_when_redis_key_missing(db, monkeypatch):
    _add_ai_usage(db)
    _add_ai_usage(db)

    monkeypatch.setattr(ai_service, "redis_client", RedisStub(None))
    monkeypatch.setattr(ai_service, "SessionLocal", lambda: SessionProxy(db))

    assert ai_service.get_daily_usage_count() == 2


def test_ai_rate_limit_blocks_repeated_market_request(monkeypatch):
    redis = RedisStub()
    events = []
    monkeypatch.setattr(ai_service, "redis_client", redis)
    monkeypatch.setattr(ai_service, "_log_usage", lambda **kwargs: events.append(kwargs))

    ai_service.check_ai_rate_limit("market-1", "ip:127.0.0.1")

    with pytest.raises(ai_service.AIRateLimitError) as exc:
        ai_service.check_ai_rate_limit("market-1", "ip:127.0.0.1")

    assert "Esperá un minuto" in str(exc.value)
    assert events[-1]["status"] == "rate_limited"
    assert events[-1]["error_message"] == "market_cooldown"


def test_ai_rate_limit_blocks_requester_after_window_limit(monkeypatch):
    redis = RedisStub()
    events = []
    monkeypatch.setattr(ai_service, "redis_client", redis)
    monkeypatch.setattr(ai_service, "_log_usage", lambda **kwargs: events.append(kwargs))

    for index in range(ai_service.RATE_LIMIT_MAX_REQUESTS):
        ai_service.check_ai_rate_limit(f"market-{index}", "ip:127.0.0.1")

    with pytest.raises(ai_service.AIRateLimitError) as exc:
        ai_service.check_ai_rate_limit("market-over-limit", "ip:127.0.0.1")

    assert "Demasiadas solicitudes" in str(exc.value)
    assert events[-1]["status"] == "rate_limited"
    assert events[-1]["error_message"] == "requester_rate_limit"


def test_get_or_create_analysis_rejects_concurrent_generation(monkeypatch):
    redis = RedisStub()
    redis.store[ai_service._get_generation_lock_key("market-1")] = "1"
    events = []
    monkeypatch.setattr(ai_service, "redis_client", redis)
    monkeypatch.setattr(ai_service, "_log_usage", lambda **kwargs: events.append(kwargs))
    monkeypatch.setattr(
        ai_service,
        "analyze_market",
        lambda *_args, **_kwargs: pytest.fail("Gemini should not be called"),
    )

    with pytest.raises(ai_service.AIRateLimitError) as exc:
        ai_service.get_or_create_analysis("market-1", {"id": "market-1"})

    assert "análisis IA en curso" in str(exc.value)
    assert events[-1]["status"] == "rate_limited"
    assert events[-1]["error_message"] == "analysis_in_progress"


def test_get_or_create_analysis_releases_generation_lock_on_success(monkeypatch):
    redis = RedisStub()
    monkeypatch.setattr(ai_service, "redis_client", redis)
    monkeypatch.setattr(
        ai_service,
        "analyze_market",
        lambda *_args, **_kwargs: {"probability": 55, "confidence": "medium"},
    )

    result = ai_service.get_or_create_analysis("market-1", {"id": "market-1"})

    assert result["cached"] is False
    assert ai_service._get_generation_lock_key("market-1") not in redis.store
    assert ai_service._get_cache_key("market-1") in redis.store
