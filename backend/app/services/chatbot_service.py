"""
Chatbot service: conversational assistant using Gemini function calling.

Public (unauthenticated) users only get access to static platform info.
Authenticated users additionally get a tool to query their own predictions.
Market lookups are available to everyone since market data is already public.
"""

import logging
import time
from typing import Optional

from google.genai import types
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import SessionLocal
from app.models.ai_usage_log import AIUsageLog
from app.models.market import Market, MarketStatus
from app.models.prediction import Prediction
from app.models.user import User
from app.services.ai_service import gemini_client, redis_client

logger = logging.getLogger(__name__)

# Redis-backed rate limiting for POST /api/chatbot, same shape as ai_service.py.
CHATBOT_RATE_LIMIT_WINDOW_SECONDS = 60
CHATBOT_RATE_LIMIT_MAX_REQUESTS = 15

PLATFORM_INFO_CACHE_TTL = 24 * 60 * 60

MAX_FUNCTION_CALL_ROUNDS = 4
MAX_TOOL_RESULT_ITEMS = 10


class ChatbotRateLimitError(RuntimeError):
    """Raised when a chatbot request is intentionally throttled."""


# Static platform info, in Spanish, matching frontend/src/app/metodologia/page.tsx
PLATFORM_INFO: dict[str, str] = {
    "que_es": (
        "PredictaX es una plataforma de mercados de predicción para América Latina: "
        "los usuarios predicen resultados sobre economía, política, deportes, tecnología "
        "y criptomonedas, apostando puntos virtuales a favor o en contra de que un evento ocurra."
    ),
    "metodologia": (
        "El porcentaje de cada mercado se arma en 4 pasos: 1) Señales de tendencia — se toman "
        "los temas con mayor volumen de búsquedas en Google Trends Argentina. 2) Contexto "
        "histórico por categoría — se consideran ciclos previos según el rubro (tipo de cambio "
        "e inflación en economía, resultados electorales en política, forma reciente en deportes, "
        "etc). 3) Estimación de IA (Gemini) — un modelo de lenguaje produce una probabilidad "
        "inicial conservadora entre 10% y 90%. 4) Sabiduría colectiva — una vez publicado el "
        "mercado, el porcentaje se mueve según el ratio de puntos apostados a SÍ sobre el total "
        "apostado por la comunidad."
    ),
    "limitaciones": (
        "El modelo no incorpora noticias posteriores a la creación del mercado, no pondera "
        "el historial de aciertos de cada usuario (todos los puntos valen igual), y un "
        "porcentaje alto nunca es garantía de que el evento vaya a ocurrir: solo indica que, "
        "según el modelo y la comunidad, ese desenlace es más probable que su contrario."
    ),
    "como_funciona": (
        "Registrate gratis, elegí un mercado activo y apostá tus puntos (arrancás con 1000) "
        "a que un evento va a pasar (SÍ) o no va a pasar (NO). El porcentaje visible es la "
        "probabilidad estimada de que ocurra. Cuando el mercado se resuelve, quienes acertaron "
        "ganan puntos a partir de lo apostado por quienes se equivocaron."
    ),
}


def _log_usage(
    user_id: Optional[str] = None,
    response_time_ms: Optional[int] = None,
    total_tokens: Optional[int] = None,
    status: str = "success",
    error_message: Optional[str] = None,
):
    """Log chatbot usage to the shared ai_usage_log table."""
    try:
        db = SessionLocal()
        log = AIUsageLog(
            user_id=user_id,
            market_id=None,
            provider="gemini",
            model=settings.GEMINI_MODEL,
            total_tokens=total_tokens,
            response_time_ms=response_time_ms,
            cache_hit=False,
            status=status,
            error_message=error_message,
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"Failed to log chatbot usage: {e}")


def _get_rate_key(requester_id: str) -> str:
    return f"chatbot_rate:{requester_id}"


def check_chatbot_rate_limit(requester_id: Optional[str]) -> None:
    """Throttle repeated chatbot messages per requester (user id or IP)."""
    if not redis_client or not requester_id:
        return

    try:
        key = _get_rate_key(requester_id)
        request_count = redis_client.incr(key)
        if request_count == 1:
            redis_client.expire(key, CHATBOT_RATE_LIMIT_WINDOW_SECONDS)

        if request_count > CHATBOT_RATE_LIMIT_MAX_REQUESTS:
            raise ChatbotRateLimitError(
                "Demasiados mensajes. Esperá un minuto e intentá nuevamente."
            )
    except ChatbotRateLimitError:
        raise
    except Exception as e:
        logger.warning(f"Chatbot rate limit check failed open: {e}")


def _tool_get_user_predictions(db: Session, user: User) -> list[dict]:
    """Active/recent predictions for the authenticated user, with market context."""
    rows = (
        db.query(Prediction, Market)
        .join(Market, Prediction.market_id == Market.id)
        .filter(Prediction.user_id == user.id)
        .order_by(Prediction.created_at.desc())
        .limit(MAX_TOOL_RESULT_ITEMS)
        .all()
    )
    return [
        {
            "market_title": market.title,
            "market_category": market.category.value,
            "market_status": market.status.value,
            "current_probability": float(market.probability_market),
            "predicted_side": "SI" if prediction.probability > 50 else "NO",
            "points_wagered": prediction.points_wagered,
            "probability_at_bet": prediction.probability_at_bet,
            "status": prediction.status,
        }
        for prediction, market in rows
    ]


def _tool_get_market_info(db: Session, query: str) -> Optional[dict]:
    """Look up a single market by title match."""
    market = (
        db.query(Market)
        .filter(Market.title.ilike(f"%{query}%"))
        .order_by(Market.created_at.desc())
        .first()
    )
    if not market:
        return None
    return {
        "title": market.title,
        "category": market.category.value,
        "status": market.status.value,
        "current_probability": float(market.probability_market),
        "end_date": market.end_date.isoformat(),
        "participants_count": market.participants_count,
    }


def _tool_list_active_markets(db: Session, category: Optional[str] = None) -> list[dict]:
    """List currently active markets, optionally filtered by category."""
    q = db.query(Market).filter(Market.status == MarketStatus.ACTIVE)
    if category:
        q = q.filter(Market.category == category)
    markets = q.order_by(Market.volume.desc()).limit(MAX_TOOL_RESULT_ITEMS).all()
    return [
        {
            "title": m.title,
            "category": m.category.value,
            "current_probability": float(m.probability_market),
            "end_date": m.end_date.isoformat(),
        }
        for m in markets
    ]


def _tool_get_platform_info(topic: str) -> str:
    return PLATFORM_INFO.get(topic, PLATFORM_INFO["que_es"])


_MARKET_INFO_DECLARATION = types.FunctionDeclaration(
    name="get_market_info",
    description="Busca un mercado de predicción activo o resuelto por título aproximado.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "query": types.Schema(
                type=types.Type.STRING,
                description="Texto a buscar en el título del mercado",
            ),
        },
        required=["query"],
    ),
)

_LIST_ACTIVE_MARKETS_DECLARATION = types.FunctionDeclaration(
    name="list_active_markets",
    description="Lista los mercados de predicción activos, opcionalmente filtrados por categoría.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "category": types.Schema(
                type=types.Type.STRING,
                enum=["economia", "politica", "deportes", "tecnologia", "crypto", "mundial"],
                description="Categoría a filtrar (opcional)",
            ),
        },
    ),
)

_GET_PLATFORM_INFO_DECLARATION = types.FunctionDeclaration(
    name="get_platform_info",
    description=(
        "Devuelve información general sobre PredictaX: qué es, metodología, "
        "limitaciones o cómo funciona."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "topic": types.Schema(
                type=types.Type.STRING,
                enum=["que_es", "metodologia", "limitaciones", "como_funciona"],
                description="Tema sobre el que se pregunta",
            ),
        },
        required=["topic"],
    ),
)

_GET_USER_PREDICTIONS_DECLARATION = types.FunctionDeclaration(
    name="get_user_predictions",
    description=(
        "Devuelve las predicciones (apuestas) del usuario autenticado que está chateando, "
        "con el mercado asociado y el estado actual."
    ),
)


def _build_tools(has_user: bool) -> list[types.Tool]:
    declarations = [
        _GET_PLATFORM_INFO_DECLARATION,
        _MARKET_INFO_DECLARATION,
        _LIST_ACTIVE_MARKETS_DECLARATION,
    ]
    if has_user:
        declarations.append(_GET_USER_PREDICTIONS_DECLARATION)
    return [types.Tool(functionDeclarations=declarations)]


def _build_system_prompt(user: Optional[User]) -> str:
    base = (
        "Sos el asistente virtual de PredictaX, una plataforma de mercados de predicción "
        "para América Latina. Respondé siempre en español rioplatense, de forma breve y clara. "
        "Usá las funciones disponibles para consultar datos reales en vez de inventar cifras."
    )
    if user:
        return (
            f"{base}\n\nEl usuario que te escribe está autenticado como '{user.username}'. "
            "Podés usar get_user_predictions para ver sus apuestas activas, además de "
            "get_market_info, list_active_markets y get_platform_info."
        )
    return (
        f"{base}\n\nEl usuario que te escribe NO está autenticado. No tenés acceso a datos "
        "personales de ningún usuario. Solo podés usar get_market_info, list_active_markets "
        "y get_platform_info. Si te preguntan por 'mis apuestas' o datos personales, explicá "
        "que necesitan iniciar sesión primero."
    )


def _execute_tool(db: Session, user: Optional[User], name: str, args: dict) -> dict:
    if name == "get_user_predictions" and user is not None:
        return {"predictions": _tool_get_user_predictions(db, user)}
    if name == "get_market_info":
        result = _tool_get_market_info(db, args.get("query", ""))
        return {"market": result} if result else {"market": None, "note": "No encontrado"}
    if name == "list_active_markets":
        return {"markets": _tool_list_active_markets(db, args.get("category"))}
    if name == "get_platform_info":
        return {"info": _tool_get_platform_info(args.get("topic", "que_es"))}
    return {"error": f"Unknown or unauthorized tool: {name}"}


def send_message(
    db: Session,
    message: str,
    history: list[dict],
    user: Optional[User],
    requester_id: Optional[str] = None,
) -> str:
    """
    Send a user message to Gemini with function calling and return the final reply.

    Args:
        db: Database session
        message: The user's new message
        history: Prior turns as [{"role": "user"|"assistant", "content": str}, ...]
        user: Authenticated user, or None for public/anonymous chat
        requester_id: Fingerprint (user id or IP) used for rate limiting

    Returns:
        The assistant's final text reply

    Raises:
        ChatbotRateLimitError: If throttled
        RuntimeError: If Gemini is not configured or the call fails
    """
    if not gemini_client:
        raise RuntimeError("Chatbot service not available. GEMINI_API_KEY not configured.")

    check_chatbot_rate_limit(requester_id)

    contents: list[types.Content] = []
    for turn in history:
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=turn.get("content", ""))]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    user_id = str(user.id) if user else None
    start_time = time.time()

    try:
        tools = _build_tools(has_user=user is not None)
        config = types.GenerateContentConfig(
            system_instruction=_build_system_prompt(user),
            tools=tools,
            temperature=0.4,
        )

        final_text = ""
        for _ in range(MAX_FUNCTION_CALL_ROUNDS):
            response = gemini_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=config,
            )
            function_calls = getattr(response, "function_calls", None)
            if not function_calls:
                final_text = response.text or ""
                break

            candidate_content = response.candidates[0].content
            contents.append(candidate_content)

            response_parts = []
            for call in function_calls:
                result = _execute_tool(db, user, call.name, dict(call.args or {}))
                response_parts.append(
                    types.Part.from_function_response(name=call.name, response=result)
                )
            contents.append(types.Content(role="user", parts=response_parts))
        else:
            final_text = "No pude terminar de procesar tu consulta. Probá reformularla."

        elapsed_ms = int((time.time() - start_time) * 1000)
        tokens = getattr(response, "usage_metadata", None)
        total_tokens = getattr(tokens, "total_token_count", None) if tokens else None

        _log_usage(
            user_id=user_id,
            response_time_ms=elapsed_ms,
            total_tokens=total_tokens,
            status="success",
        )
        return final_text
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        _log_usage(
            user_id=user_id,
            response_time_ms=elapsed_ms,
            status="error",
            error_message=str(e),
        )
        logger.error(f"Chatbot Gemini error: {e}")
        raise RuntimeError(f"Chatbot request failed: {str(e)}")
