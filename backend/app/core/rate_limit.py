import logging
from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

try:
    from app.config import settings
    import redis

    _url = settings.REDIS_URL
    if _url and any(_url.startswith(s) for s in ("redis://", "rediss://", "unix://")):
        redis_client = redis.from_url(_url, decode_responses=True)
    else:
        redis_client = None
        logger.warning("Redis not available for rate limiting: invalid or missing REDIS_URL. Rate limiting disabled.")
except Exception as exc:
    redis_client = None
    logger.warning("Redis not available for rate limiting: %s. Rate limiting disabled.", exc)


async def enforce_rate_limit(request: Request, max_requests: int = 60, window_seconds: int = 60) -> None:
    """
    Enforce a sliding-window rate limit per client IP.
    No-ops silently when Redis is unavailable.
    """
    if redis_client is None:
        return

    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}:{request.url.path}"

    try:
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = pipe.execute()
        count = results[0]

        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Rate limit check failed: %s", exc)
