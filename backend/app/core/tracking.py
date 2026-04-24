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
    try:
        db = SessionLocal()
        log = ActivityLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata, ensure_ascii=False) if metadata else None,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            response_time_ms=response_time_ms,
            status_code=status_code,
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"Failed to log activity: {e}")
