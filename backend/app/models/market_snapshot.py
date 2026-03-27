from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MarketSnapshot(Base):
    """Market snapshot model for historical probability data"""

    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(
        Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False
    )
    probability = Column(Float, nullable=False)  # Market probability at this time
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships
    market = relationship("Market", back_populates="snapshots")
