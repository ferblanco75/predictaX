from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.request_ip import get_client_ip
from app.core.security import decode_token
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services import chatbot_service

router = APIRouter()


def _get_requester_id(request: Request, user: Optional[User]) -> str:
    """Prefer authenticated user id for chatbot throttling; fall back to client IP."""
    if user:
        return f"user:{user.id}"

    auth_header = request.headers.get("authorization", "")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() == "bearer" and token:
        payload = decode_token(token)
        user_id = payload.get("sub") if payload else None
        if user_id:
            return f"user:{user_id}"

    return f"ip:{get_client_ip(request)}"


@router.post("", response_model=ChatResponse)
def chat(
    request: Request,
    body: ChatRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    requester_id = _get_requester_id(request, current_user)
    history = [{"role": m.role, "content": m.content} for m in body.history]
    try:
        reply = chatbot_service.send_message(
            db, body.message, history, current_user, requester_id=requester_id
        )
        return ChatResponse(reply=reply)
    except chatbot_service.ChatbotRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
