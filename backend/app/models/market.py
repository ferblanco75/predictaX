from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class MarketCategory(str, enum.Enum):
    """Market category enum"""

    ECONOMIA = "economia"
    POLITICA = "politica"
    DEPORTES = "deportes"
    TECNOLOGIA = "tecnologia"
    CRYPTO = "crypto"


class MarketStatus(str, enum.Enum):
    """Market status enum"""

    ACTIVE = "active"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class MarketType(str, enum.Enum):
    """Market type enum"""

    BINARY = "binary"
    MULTIPLE_CHOICE = "multiple_choice"
    NUMERIC = "numeric"


class Market(Base):
    """Market model for prediction markets"""

    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(MarketCategory), nullable=False, index=True)
    type = Column(Enum(MarketType), default=MarketType.BINARY)
    probability_market = Column(Float, default=50.0)  # Current market probability
    volume = Column(Float, default=0.0)  # Total volume in points
    participants_count = Column(Integer, default=0)  # Number of unique participants
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(MarketStatus), default=MarketStatus.ACTIVE, index=True)
    resolution_value = Column(Boolean, nullable=True)  # True/False for binary, null if unresolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    predictions = relationship(
        "Prediction", back_populates="market", cascade="all, delete-orphan"
    )
    snapshots = relationship(
        "MarketSnapshot", back_populates="market", cascade="all, delete-orphan"
    )
