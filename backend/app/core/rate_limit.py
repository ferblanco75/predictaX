import logging
import time
from typing import Optional

import redis
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[redis.Redis] = None
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except redis.RedisError as exc:
    logger.warning(f"Redis not available for rate limiting: {exc}. Using memory fallback.")
    redis_client = None

_memory_counts: dict[str, tuple[float, int]] = {}


def _check_memory_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    now = time.time()
    expires_at, count = _memory_counts.get(key, (now + window_seconds, 0))

    if expires_at <= now:
        expires_at = now + window_seconds
        count = 0

    count += 1
    _memory_counts[key] = (expires_at, count)

    return count <= max_requests, max(1, int(expires_at - now))


def enforce_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """Raise 429 when a namespaced key exceeds the allowed request count."""
    namespaced_key = f"rate_limit:{key}"
    retry_after = window_seconds

    if redis_client:
        try:
            count = redis_client.incr(namespaced_key)
            if count == 1:
                redis_client.expire(namespaced_key, window_seconds)
            ttl = redis_client.ttl(namespaced_key)
            retry_after = ttl if ttl > 0 else window_seconds
            allowed = count <= max_requests
        except redis.RedisError as exc:
            logger.warning(f"Redis rate limit check failed: {exc}. Using memory fallback.")
            allowed, retry_after = _check_memory_rate_limit(
                namespaced_key,
                max_requests,
                window_seconds,
            )
    else:
        allowed, retry_after = _check_memory_rate_limit(
            namespaced_key,
            max_requests,
            window_seconds,
        )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )


def clear_rate_limits(prefix: str = "rate_limit:") -> None:
    """Clear rate limit keys; used by tests to isolate cases."""
    for key in list(_memory_counts):
        if key.startswith(prefix):
            _memory_counts.pop(key, None)

    if not redis_client:
        return

    try:
        keys = list(redis_client.scan_iter(f"{prefix}*"))
        if keys:
            redis_client.delete(*keys)
    except redis.RedisError as exc:
        logger.warning(f"Redis rate limit cleanup failed: {exc}")
