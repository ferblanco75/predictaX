"""
Pydantic schemas for request/response validation.
"""

from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenData
from app.schemas.market import (
    MarketCreate,
    MarketUpdate,
    MarketResponse,
    MarketListResponse,
    MarketHistoryPoint,
)
from app.schemas.prediction import PredictionCreate, PredictionResponse
from app.schemas.common import ErrorResponse, SuccessResponse, HealthResponse

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
