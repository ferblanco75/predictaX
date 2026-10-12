import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    referred_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    referral_code = Column(String(16), nullable=False, index=True)
    referrer_bonus_awarded = Column(Boolean, default=False, nullable=False)
    referred_bonus_awarded = Column(Boolean, default=False, nullable=False)
    # #282: the IP the referred account verified from, so a referrer can't farm
    # an unbounded number of signups off a single machine.
    signup_ip = Column(String(45), nullable=True, index=True)
    # #282: which cap is currently withholding the bonuses, if any. NULL means
    # paid or still pending on the activity threshold. Kept on the row so
    # farming patterns are reviewable after the fact.
    bonus_blocked_reason = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    referrer = relationship("User", foreign_keys=[referrer_id])
    referred = relationship("User", foreign_keys=[referred_id])
