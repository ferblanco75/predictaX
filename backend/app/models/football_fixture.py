
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database import Base


class FootballFixture(Base):
    __tablename__ = "football_fixtures"

    id = Column(Integer, primary_key=True)  # football-data.org match id
    competition_code = Column(String(20), nullable=False, default="WC")
    matchday = Column(Integer, nullable=True)
    stage = Column(String(50), nullable=True)
    group = Column(String(20), nullable=True)
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    home_team_crest = Column(String(500), nullable=True)
    away_team_crest = Column(String(500), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), nullable=False, default="TIMED")
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    winner = Column(String(10), nullable=True)  # HOME / AWAY / DRAW
    venue = Column(String(200), nullable=True)
    raw_data = Column(JSONB, nullable=True)
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
