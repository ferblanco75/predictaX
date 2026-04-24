"""
SQLAlchemy models for PredictaX.

Import all models here so Alembic can detect them for migrations.
"""

from app.models.activity_log import ActivityLog
from app.models.ai_usage_log import AIUsageLog
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.market_snapshot import MarketSnapshot
from app.models.prediction import Prediction
from app.models.user import User

__all__ = [
    "User",
    "Market",
    "MarketCategory",
    "MarketStatus",
    "MarketType",
    "Prediction",
    "MarketSnapshot",
    "AIUsageLog",
    "ActivityLog",
]
