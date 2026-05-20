from datetime import datetime, timedelta, timezone

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
    def __init__(self, value):
        self.value = value

    def get(self, _key):
        return self.value


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
