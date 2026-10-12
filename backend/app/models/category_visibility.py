from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class CategoryVisibility(Base):
    """Admin-controlled visibility per market category.

    Absence of a row means visible — see category_visibility_service for the
    fail-open default, so a fresh migration or a lookup error never hides
    categories that were never explicitly toggled off.
    """

    __tablename__ = "category_visibility"

    category = Column(String(20), primary_key=True)
    is_visible = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
