import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(MarketCategory), nullable=False, index=True)
    type = Column(Enum(MarketType), default=MarketType.BINARY)
    probability_market = Column(Numeric(5, 2), default=50.00)
    volume = Column(Float, default=0.0)
    participants_count = Column(Integer, default=0)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(MarketStatus), default=MarketStatus.ACTIVE, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_value = Column(Boolean, nullable=True)
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_markets")
    predictions = relationship(
        "Prediction", back_populates="market", cascade="all, delete-orphan"
    )
    snapshots = relationship(
        "MarketSnapshot", back_populates="market", cascade="all, delete-orphan"
    )
