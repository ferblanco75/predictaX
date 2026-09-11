"""
Request tracking middleware and activity logging utilities.
"""

import json
import logging
from typing import Optional

from app.core.database import SessionLocal
from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    endpoint: Optional[str] = None,
    response_time_ms: Optional[int] = None,
    status_code: Optional[int] = None,
):
    """Log a user activity to the database."""
    db = None
    try:
        db = SessionLocal()
        log = ActivityLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata, ensure_ascii=False) if metadata else None,
            # #260: an oversized value here must never raise past this
            # try/except silently — that let an attacker pad a path to evade
            # tracking entirely (INSERT fails, exception swallowed, request
            # untraced). Truncate to the column width up front instead.
            ip_address=(ip_address or "")[:45] or None,
            user_agent=(user_agent or "")[:500] or None,
            endpoint=(endpoint or "")[:200] or None,
            response_time_ms=response_time_ms,
            status_code=status_code,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log activity (action={action!r}): {e}")
    finally:
        if db:
            db.close()
