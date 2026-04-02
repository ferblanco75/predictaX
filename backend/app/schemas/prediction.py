from pydantic import BaseModel, Field
from datetime import datetime


class PredictionCreate(BaseModel):
    """Schema for creating a new prediction"""

    market_id: int
    probability: float = Field(ge=0, le=100, description="Predicted probability (0-100)")
    points_wagered: float = Field(gt=0, description="Points to wager (must be positive)")


class PredictionResponse(BaseModel):
    """Schema for prediction response"""

    id: int
    user_id: int
    market_id: int
    probability: float
    points_wagered: float
    created_at: datetime

    class Config:
        from_attributes = True
