"""
SQLAlchemy models for PredictaX.

Import all models here so Alembic can detect them for migrations.
"""

from app.models.user import User
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.prediction import Prediction
from app.models.market_snapshot import MarketSnapshot

__all__ = [
    "User",
    "Market",
    "MarketCategory",
    "MarketStatus",
    "MarketType",
    "Prediction",
    "MarketSnapshot",
]
