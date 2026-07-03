from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PredictionCreate(BaseModel):
    """Schema for creating a new prediction.

    probability > 50 → YES bet, probability < 50 → NO bet.
    The frontend sends 75 (YES) or 25 (NO); other values are also valid.
    Exactly 50 is rejected because the resolution logic uses `> 50` to determine
    the bet direction, making 50 ambiguous (it would silently count as NO).
    """

    market_id: UUID
    probability: float = Field(ge=0, le=100, description="Predicted probability (0-100)")
    points_wagered: float = Field(
        gt=0,
        le=10000,
        description="Points to wager (must be positive, max 10,000)",
    )

    @field_validator("probability")
    @classmethod
    def probability_not_ambiguous(cls, v: float) -> float:
        if v == 50:
            raise ValueError(
                "No podés apostar exactamente 50%. Elegí un valor mayor (SÍ) o menor (NO) que 50."
            )
        return v


class PredictionResponse(BaseModel):
    """Schema for prediction response"""

    id: UUID
    user_id: UUID
    market_id: UUID
    market_title: str | None = None
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
