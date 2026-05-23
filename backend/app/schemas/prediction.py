from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PredictionCreate(BaseModel):
    """Schema for creating a new prediction"""

    market_id: UUID
    probability: float = Field(ge=0, le=100, description="Predicted probability (0-100)")
    points_wagered: float = Field(
        gt=0,
        le=10000,
        description="Points to wager (must be positive, max 10,000)",
    )


class PredictionResponse(BaseModel):
    """Schema for prediction response"""

    id: UUID
    user_id: UUID
    market_id: UUID
    probability: float
    points_wagered: float
    potential_gain: float | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PublicMarketPredictionResponse(BaseModel):
    """Public prediction data for market activity feeds."""

    id: UUID
    market_id: UUID
    probability: float
    points_wagered: float
    created_at: datetime

    class Config:
        from_attributes = True
