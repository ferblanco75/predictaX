from datetime import datetime, timezone
from secrets import token_urlsafe
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.dependencies import get_current_user
from app.models.activity_log import ActivityLog
from app.models.ai_usage_log import AIUsageLog
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.user import CookieConsentUpdate, UserDeleteRequest, UserResponse

router = APIRouter()


def _isoformat(value) -> str | None:
    return value.isoformat() if value else None


def _deleted_user_identifier(user_id) -> str:
    return f"deleted-{user_id}"


@router.get("/leaderboard", response_model=List[UserResponse])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=100, description="Number of top users"),
    db: Session = Depends(get_db),
):
    """
    Get top users by points (leaderboard).

    Args:
        limit: Number of top users to return
        db: Database session

    Returns:
        List of top users ordered by points
    """
    users = (
        db.query(User)
        .order_by(User.points.desc())
        .limit(limit)
        .all()
    )

    return users


@router.get("/me/data-export")
def export_current_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return a machine-readable export of the authenticated user's data."""
    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    activity_logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(1000)
        .all()
    )
    ai_usage_logs = (
        db.query(AIUsageLog)
        .filter(AIUsageLog.user_id == current_user.id)
        .order_by(AIUsageLog.created_at.desc())
        .limit(1000)
        .all()
    )

    return {
        "export_version": "2026-05-21",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "id": str(current_user.id),
            "email": current_user.email,
            "username": current_user.username,
            "points": current_user.points,
            "role": current_user.role,
            "created_at": _isoformat(current_user.created_at),
            "updated_at": _isoformat(current_user.updated_at),
        },
        "consents": {
            "terms_accepted_at": _isoformat(current_user.terms_accepted_at),
            "privacy_accepted_at": _isoformat(current_user.privacy_accepted_at),
            "age_confirmed_at": _isoformat(current_user.age_confirmed_at),
            "legal_consent_version": current_user.legal_consent_version,
            "marketing_opt_in": current_user.marketing_opt_in,
            "marketing_opt_in_at": _isoformat(current_user.marketing_opt_in_at),
            "cookie_consent": {
                "analytics": current_user.cookie_consent_analytics,
                "functional": current_user.cookie_consent_functional,
                "marketing": current_user.cookie_consent_marketing,
                "version": current_user.cookie_consent_version,
                "updated_at": _isoformat(current_user.cookie_consent_updated_at),
            },
        },
        "predictions": [
            {
                "id": str(prediction.id),
                "market_id": str(prediction.market_id),
                "market_title": prediction.market.title if prediction.market else None,
                "probability": prediction.probability,
                "points_wagered": prediction.points_wagered,
                "potential_gain": prediction.potential_gain,
                "status": prediction.status,
                "created_at": _isoformat(prediction.created_at),
            }
            for prediction in predictions
        ],
        "activity_logs": [
            {
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "metadata_json": log.metadata_json,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "response_time_ms": log.response_time_ms,
                "status_code": log.status_code,
                "endpoint": log.endpoint,
                "created_at": _isoformat(log.created_at),
            }
            for log in activity_logs
        ],
        "ai_usage": [
            {
                "id": str(log.id),
                "market_id": str(log.market_id) if log.market_id else None,
                "provider": log.provider,
                "model": log.model,
                "prompt_tokens": log.prompt_tokens,
                "completion_tokens": log.completion_tokens,
                "total_tokens": log.total_tokens,
                "response_time_ms": log.response_time_ms,
                "cache_hit": log.cache_hit,
                "status": log.status,
                "error_message": log.error_message,
                "created_at": _isoformat(log.created_at),
            }
            for log in ai_usage_logs
        ],
        "notes": [
            "This JSON export contains data currently linked to the authenticated user account.",
            "Activity logs are included only when they are explicitly associated with the user id.",
        ],
    }


@router.put("/me/cookie-consent")
def update_current_user_cookie_consent(
    consent: CookieConsentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Persist authenticated cookie consent preferences."""
    updated_at = datetime.now(timezone.utc)
    current_user.cookie_consent_analytics = consent.analytics
    current_user.cookie_consent_functional = consent.functional
    current_user.cookie_consent_marketing = consent.marketing
    current_user.cookie_consent_version = consent.version
    current_user.cookie_consent_updated_at = updated_at
    db.commit()

    return {
        "essential": True,
        "analytics": current_user.cookie_consent_analytics,
        "functional": current_user.cookie_consent_functional,
        "marketing": current_user.cookie_consent_marketing,
        "version": current_user.cookie_consent_version,
        "updated_at": updated_at.isoformat(),
    }


@router.delete("/me")
def delete_current_user_account(
    delete_request: UserDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Anonymize and deactivate the authenticated user's account."""
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    deleted_identifier = _deleted_user_identifier(current_user.id)
    deleted_at = datetime.now(timezone.utc)

    current_user.email = f"{deleted_identifier}@deleted.local"
    current_user.username = deleted_identifier
    current_user.hashed_password = get_password_hash(token_urlsafe(32))
    current_user.avatar_url = None
    current_user.points = 0
    current_user.role = "user"
    current_user.is_active = False
    current_user.marketing_opt_in = False
    current_user.marketing_opt_in_at = None
    current_user.cookie_consent_analytics = False
    current_user.cookie_consent_functional = False
    current_user.cookie_consent_marketing = False
    current_user.cookie_consent_version = None
    current_user.cookie_consent_updated_at = None
    current_user.deleted_at = deleted_at

    db.commit()

    return {
        "message": "Account anonymized and deactivated",
        "deleted_at": deleted_at.isoformat(),
    }
