"""
Pydantic schemas for request/response validation.
"""

from app.schemas.common import ErrorResponse, HealthResponse, SuccessResponse
from app.schemas.market import (
    MarketCreate,
    MarketHistoryPoint,
    MarketListResponse,
    MarketResponse,
    MarketUpdate,
)
from app.schemas.prediction import PredictionCreate, PredictionResponse
from app.schemas.user import Token, TokenData, UserCreate, UserLogin, UserResponse

__all__ = [
    # User schemas
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenData",
    # Market schemas
    "MarketCreate",
    "MarketUpdate",
    "MarketResponse",
    "MarketListResponse",
    "MarketHistoryPoint",
    # Prediction schemas
    "PredictionCreate",
    "PredictionResponse",
    # Common schemas
    "ErrorResponse",
    "SuccessResponse",
    "HealthResponse",
]
