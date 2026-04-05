"""
AI Service for market analysis using Google Gemini.
"""

import json
import logging
import time
from typing import Optional

import redis
from google import genai
from google.genai import types

from app.config import settings
from app.core.database import SessionLocal
from app.models.ai_usage_log import AIUsageLog

logger = logging.getLogger(__name__)

# Initialize Redis client for caching
redis_client: Optional[redis.Redis] = None
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connected for AI cache")
except Exception as e:
    logger.warning(f"Redis not available for AI cache: {e}. Caching disabled.")
    redis_client = None

# Initialize Gemini client
gemini_client: Optional[genai.Client] = None
if settings.GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    logger.info(f"Gemini client initialized with model: {settings.GEMINI_MODEL}")
else:
    logger.warning("GEMINI_API_KEY not set. AI analysis disabled.")

# Cache TTL: 6 hours
CACHE_TTL = 6 * 60 * 60

# Response schema for structured output
ANALYSIS_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "probability": types.Schema(
            type=types.Type.NUMBER,
            description="Estimated probability 0-100",
        ),
        "confidence": types.Schema(
            type=types.Type.STRING,
            enum=["low", "medium", "high"],
            description="Confidence level of the analysis",
        ),
        "reasoning": types.Schema(
            type=types.Type.STRING,
            description="Detailed reasoning in Spanish, 2-3 paragraphs",
        ),
        "key_factors": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
            description="3-5 key factors influencing the prediction",
        ),
        "risks": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
            description="2-3 main risks",
        ),
    },
    required=["probability", "confidence", "reasoning", "key_factors", "risks"],
)


def _log_usage(
    market_id: Optional[str] = None,
    user_id: Optional[str] = None,
    cache_hit: bool = False,
    response_time_ms: Optional[int] = None,
    total_tokens: Optional[int] = None,
    status: str = "success",
    error_message: Optional[str] = None,
):
    """Log AI usage to database for tracking and quota monitoring."""
    try:
        db = SessionLocal()
        log = AIUsageLog(
            user_id=user_id,
            market_id=market_id,
            provider="gemini",
            model=settings.GEMINI_MODEL,
            total_tokens=total_tokens,
            response_time_ms=response_time_ms,
            cache_hit=cache_hit,
            status=status,
            error_message=error_message,
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"Failed to log AI usage: {e}")


def _get_daily_quota_key() -> str:
    from datetime import date
    return f"ai_quota:daily:{date.today().isoformat()}"


def get_daily_usage_count() -> int:
    """Get the number of Gemini API calls made today."""
    if not redis_client:
        return 0
    try:
        count = redis_client.get(_get_daily_quota_key())
        return int(count) if count else 0
    except Exception:
        return 0


def _increment_daily_quota():
    """Increment daily API call counter in Redis."""
    if not redis_client:
        return
    try:
        key = _get_daily_quota_key()
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 90000)  # 25 hours TTL
        pipe.execute()
    except Exception as e:
        logger.warning(f"Failed to increment quota counter: {e}")


def _build_prompt(market: dict) -> str:
    """Build the analysis prompt for a market."""
    return f"""Eres un analista experto en mercados de predicción para América Latina.

Analiza el siguiente mercado y proporciona tu predicción:

**Título:** {market.get('title', 'N/A')}
**Descripción:** {market.get('description', 'N/A')}
**Categoría:** {market.get('category', 'N/A')}
**Probabilidad actual del mercado:** {market.get('probability', 'N/A')}%
**Fecha de cierre:** {market.get('endDate', 'N/A')}
**Participantes:** {market.get('participants', 0)}
**Volumen:** {market.get('volume', '$0')}

Proporciona un análisis detallado con:
1. Tu estimación de probabilidad (puede diferir del mercado)
2. Tu nivel de confianza en el análisis
3. Un razonamiento detallado en español (2-3 párrafos)
4. Los 3-5 factores clave que influyen en el resultado
5. Los 2-3 riesgos principales que podrían cambiar el resultado

Basa tu análisis en el contexto económico, político y social actual de América Latina."""


def _get_cache_key(market_id: str) -> str:
    return f"ai_analysis:{market_id}"


def get_cached_analysis(market_id: str) -> Optional[dict]:
    """Get cached analysis from Redis."""
    if not redis_client:
        return None
    try:
        cached = redis_client.get(_get_cache_key(market_id))
        if cached:
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Redis cache read error: {e}")
    return None


def cache_analysis(market_id: str, analysis: dict):
    """Store analysis in Redis cache."""
    if not redis_client:
        return
    try:
        redis_client.setex(
            _get_cache_key(market_id),
            CACHE_TTL,
            json.dumps(analysis, ensure_ascii=False),
        )
    except Exception as e:
        logger.warning(f"Redis cache write error: {e}")


def analyze_market(market: dict, user_id: Optional[str] = None) -> dict:
    """
    Analyze a market using Gemini and return structured prediction.

    Args:
        market: Market data dict (formatted for frontend)
        user_id: Optional user ID for tracking

    Returns:
        Dict with probability, confidence, reasoning, key_factors, risks

    Raises:
        RuntimeError: If Gemini is not configured or API call fails
    """
    if not gemini_client:
        raise RuntimeError("AI service not available. GEMINI_API_KEY not configured.")

    # Check daily quota (250 RPD for free tier)
    daily_count = get_daily_usage_count()
    if daily_count >= 240:  # Leave 10 buffer
        raise RuntimeError(
            f"Daily AI quota nearly exhausted ({daily_count}/250). Try again tomorrow."
        )

    prompt = _build_prompt(market)
    market_id = market.get("id")
    start_time = time.time()

    try:
        response = gemini_client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ANALYSIS_SCHEMA,
                temperature=0.7,
            ),
        )
        elapsed_ms = int((time.time() - start_time) * 1000)
        result = json.loads(response.text)

        # Track usage
        _increment_daily_quota()
        tokens = getattr(response, "usage_metadata", None)
        total_tokens = None
        if tokens:
            total_tokens = getattr(tokens, "total_token_count", None)

        _log_usage(
            market_id=market_id,
            user_id=user_id,
            cache_hit=False,
            response_time_ms=elapsed_ms,
            total_tokens=total_tokens,
            status="success",
        )

        logger.info(
            f"AI analysis generated for market: {market.get('title', 'unknown')} "
            f"({elapsed_ms}ms, tokens: {total_tokens})"
        )
        return result
    except RuntimeError:
        raise
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        _log_usage(
            market_id=market_id,
            user_id=user_id,
            cache_hit=False,
            response_time_ms=elapsed_ms,
            status="error",
            error_message=str(e),
        )
        logger.error(f"Gemini API error: {e}")
        raise RuntimeError(f"AI analysis failed: {str(e)}")


def get_or_create_analysis(
    market_id: str, market: dict, user_id: Optional[str] = None
) -> dict:
    """
    Get cached analysis or generate a new one.

    Args:
        market_id: Market ID for cache key
        market: Market data dict
        user_id: Optional user ID for tracking

    Returns:
        Analysis dict
    """
    # Try cache first
    cached = get_cached_analysis(market_id)
    if cached:
        cached["cached"] = True
        _log_usage(market_id=market_id, user_id=user_id, cache_hit=True, status="success")
        return cached

    # Generate new analysis
    analysis = analyze_market(market, user_id=user_id)
    analysis["cached"] = False

    # Cache it
    cache_analysis(market_id, analysis)

    return analysis
