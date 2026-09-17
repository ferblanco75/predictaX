import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """User model for authentication and predictions"""

    __tablename__ = "users"

    # #276: last line of defence for the points economy. Every debit path is
    # supposed to lock the row and check the balance first; if one ever forgets,
    # the write fails here instead of leaving the account negative.
    __table_args__ = (
        CheckConstraint("points >= 0", name="ck_users_points_non_negative"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    points = Column(Float, default=1000.0)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String, default="user", nullable=False)  # 'user' or 'admin'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    age_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    legal_consent_version = Column(String(32), nullable=True)
    marketing_opt_in = Column(Boolean, default=False, nullable=False)
    marketing_opt_in_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    cookie_consent_analytics = Column(Boolean, default=False, nullable=False)
    cookie_consent_functional = Column(Boolean, default=False, nullable=False)
    cookie_consent_marketing = Column(Boolean, default=False, nullable=False)
    cookie_consent_version = Column(String(32), nullable=True)
    cookie_consent_updated_at = Column(DateTime(timezone=True), nullable=True)
    referral_code = Column(String(16), unique=True, index=True, nullable=True)
    # #280: the code submitted at registration. It only becomes a Referral row
    # once the account is verified via OTP, so pre-registering someone else's
    # email never earns attribution on its own.
    pending_referral_code = Column(String(16), nullable=True)

    # Relationships
    predictions = relationship(
        "Prediction", back_populates="user", cascade="all, delete-orphan"
    )
    created_markets = relationship(
        "Market", back_populates="creator", cascade="all, delete-orphan"
    )
