import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MarketSnapshot(Base):
    """Market snapshot model for historical probability data"""

    __tablename__ = "market_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    market_id = Column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), nullable=False
    )
    probability = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_market_snapshots_market_id_timestamp", "market_id", "timestamp"),
    )

    # Relationships
    market = relationship("Market", back_populates="snapshots")
