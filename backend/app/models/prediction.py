from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Prediction(Base):
    """Prediction model for user predictions on markets"""

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    market_id = Column(
        Integer, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False
    )
    probability = Column(Float, nullable=False)  # User's predicted probability (0-100)
    points_wagered = Column(Float, nullable=False)  # Points bet on this prediction
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="predictions")
    market = relationship("Market", back_populates="predictions")
