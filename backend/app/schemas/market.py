from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MarketHistoryPoint(BaseModel):
    """Schema for market probability history point"""

    date: str  # ISO format date string
    probability: float


class MarketCreate(BaseModel):
    """Schema for creating a new market"""

    title: str = Field(min_length=10, max_length=500)
    description: str = Field(min_length=50)
    category: str  # economia, politica, deportes, tecnologia, crypto
    end_date: datetime


class MarketUpdate(BaseModel):
    """Schema for updating a market"""

    title: Optional[str] = Field(None, min_length=10, max_length=500)
    description: Optional[str] = Field(None, min_length=50)
    status: Optional[str] = None  # active, resolved, cancelled
    resolution_value: Optional[bool] = None


class MarketResponse(BaseModel):
    """
    Schema for market response.

    Note: Field names match frontend expectations (camelCase).
    """

    id: str  # Frontend expects string ID
    title: str
    description: str
    category: str
    type: str
    probability: float
    volume: str  # Formatted as "$15.1K"
    participants: int
    endDate: str  # ISO format
    status: str
    history: List[MarketHistoryPoint]
    relatedMarkets: List[str] = []

    class Config:
        from_attributes = True


class MarketListResponse(BaseModel):
    """Schema for paginated market list"""

    data: List[MarketResponse]
    total: int
    limit: int
    offset: int
