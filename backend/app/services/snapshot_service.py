from datetime import datetime

from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot


def create_snapshot(
    db: Session, market_id: int, probability: float, timestamp: datetime = None
):
    """
    Create a market snapshot for historical probability tracking.

    Args:
        db: Database session
        market_id: Market ID
        probability: Market probability at this time
        timestamp: Optional custom timestamp (defaults to now)
    """
    snapshot = MarketSnapshot(
        market_id=market_id,
        probability=probability,
    )

    if timestamp:
        snapshot.timestamp = timestamp

    db.add(snapshot)
    db.commit()
