from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.market import Market, MarketCategory, MarketStatus
from app.models.market_snapshot import MarketSnapshot
from app.models.prediction import Prediction
from app.schemas.market import MarketHistoryPoint


def format_volume(amount: float) -> str:
    """
    Format volume amount as string.

    Examples:
        15100.0 -> "$15.1K"
        1500000.0 -> "$1.5M"
        500.0 -> "$500"

    Args:
        amount: Volume amount in points

    Returns:
        Formatted volume string
    """
    if amount >= 1_000_000:
        return f"${amount/1_000_000:.1f}M"
    elif amount >= 1_000:
        return f"${amount/1_000:.1f}K"
    else:
        return f"${amount:.0f}"


def get_markets(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[Market], int]:
    """
    Get list of markets with optional filters.

    Args:
        db: Database session
        category: Filter by category
        status: Filter by status
        limit: Maximum number of results
        offset: Offset for pagination

    Returns:
        Tuple of (markets list, total count)
    """
    query = db.query(Market)

    if category:
        query = query.filter(Market.category == MarketCategory(category))

    if status:
        query = query.filter(Market.status == MarketStatus(status))

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    markets = query.order_by(Market.created_at.desc()).offset(offset).limit(limit).all()

    return markets, total


def get_market_by_id(db: Session, market_id: int) -> Market:
    """
    Get market by ID.

    Args:
        db: Database session
        market_id: Market ID

    Returns:
        Market

    Raises:
        NotFoundException: If market not found
    """
    market = db.query(Market).filter(Market.id == market_id).first()

    if not market:
        raise NotFoundException(f"Market with ID {market_id} not found")

    return market


def get_market_history(db: Session, market_id: int) -> List[MarketHistoryPoint]:
    """
    Get market probability history.

    Args:
        db: Database session
        market_id: Market ID

    Returns:
        List of history points
    """
    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.market_id == market_id)
        .order_by(MarketSnapshot.timestamp.asc())
        .all()
    )

    return [
        MarketHistoryPoint(
            date=snapshot.timestamp.isoformat(),
            probability=snapshot.probability,
        )
        for snapshot in snapshots
    ]


def get_recent_market_history_by_market(
    db: Session, market_ids: List[int], points_per_market: int = 2
) -> dict[str, list[dict]]:
    """
    Get a short probability history for many markets in one query.

    Market cards only need enough history to show trend, so list endpoints should not load
    the full snapshot history for every market.
    """
    if not market_ids:
        return {}

    row_number = func.row_number().over(
        partition_by=MarketSnapshot.market_id,
        order_by=MarketSnapshot.timestamp.desc(),
    )

    ranked_snapshots = (
        db.query(
            MarketSnapshot.market_id.label("market_id"),
            MarketSnapshot.timestamp.label("timestamp"),
            MarketSnapshot.probability.label("probability"),
            row_number.label("row_number"),
        )
        .filter(MarketSnapshot.market_id.in_(market_ids))
        .subquery()
    )

    rows = (
        db.query(
            ranked_snapshots.c.market_id,
            ranked_snapshots.c.timestamp,
            ranked_snapshots.c.probability,
        )
        .filter(ranked_snapshots.c.row_number <= points_per_market)
        .order_by(ranked_snapshots.c.market_id, ranked_snapshots.c.timestamp.asc())
        .all()
    )

    history_by_market: dict[str, list[dict]] = {str(market_id): [] for market_id in market_ids}
    for row in rows:
        history_by_market[str(row.market_id)].append(
            {"date": row.timestamp.isoformat(), "probability": row.probability}
        )

    return history_by_market


def format_market_response(
    db: Session, market: Market, history: Optional[List[MarketHistoryPoint] | list[dict]] = None
) -> dict:
    """
    Format market model to response dict matching frontend expectations.

    Args:
        db: Database session
        market: Market model

    Returns:
        Dict with formatted market data
    """
    if history is None:
        history = get_market_history(db, market.id)

    formatted_history = [
        {
            "date": h["date"] if isinstance(h, dict) else h.date,
            "probability": h["probability"] if isinstance(h, dict) else h.probability,
        }
        for h in history
    ]

    return {
        "id": str(market.id),  # Frontend expects string
        "title": market.title,
        "description": market.description,
        "category": market.category.value,
        "type": market.type.value,
        "probability": market.probability_market,
        "volume": format_volume(market.volume),  # Format as "$15.1K"
        "participants": market.participants_count,
        "endDate": market.end_date.isoformat(),  # ISO format
        "status": market.status.value,
        "history": formatted_history,
        "relatedMarkets": [],  # TODO: Implement related markets
        "statsData": market.stats_data,
    }


def update_market_stats(db: Session, market_id: int):
    """
    Update market volume and participants count based on predictions.

    Args:
        db: Database session
        market_id: Market ID
    """
    market = get_market_by_id(db, market_id)

    # Calculate total volume
    predictions = db.query(Prediction).filter(Prediction.market_id == market_id).all()
    total_volume = sum(p.points_wagered for p in predictions)

    # Count unique participants
    unique_users = (
        db.query(Prediction.user_id)
        .filter(Prediction.market_id == market_id)
        .distinct()
        .count()
    )

    # Update market
    market.volume = total_volume
    market.participants_count = unique_users

    db.commit()
