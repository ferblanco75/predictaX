from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class AIUsageLog(Base):
    """Track all AI/LLM API usage for monitoring and quota management"""

    __tablename__ = "ai_usage_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    market_id = Column(UUID(as_uuid=True), ForeignKey("markets.id"), nullable=True)
    provider = Column(String(50), nullable=False)  # 'gemini', 'groq', etc.
    model = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    cache_hit = Column(Boolean, default=False)
    status = Column(String(20), default="success")  # 'success', 'error', 'rate_limited'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
