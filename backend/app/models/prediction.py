import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Prediction(Base):
    """Prediction model for user predictions on markets"""

    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    market_id = Column(
        UUID(as_uuid=True), ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    probability = Column(Float, nullable=False)
    points_wagered = Column(Float, nullable=False)
    potential_gain = Column(Float, nullable=True)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="predictions")
    market = relationship("Market", back_populates="predictions")
