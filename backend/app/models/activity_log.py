from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class ActivityLog(Base):
    """Track all user actions for analytics and engagement metrics"""

    __tablename__ = "activity_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False, index=True)
    # Actions: 'login', 'register', 'view_market', 'create_prediction',
    #          'ai_analysis', 'search', 'filter_category', 'page_view'
    resource_type = Column(String(50), nullable=True)  # 'market', 'prediction', 'user'
    resource_id = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)  # Extra context as JSON
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=True)
    endpoint = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
