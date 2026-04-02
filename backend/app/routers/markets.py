from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.market import MarketResponse, MarketHistoryPoint
from app.services import market_service

router = APIRouter()


@router.get("", response_model=List[MarketResponse])
def list_markets(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("active", description="Filter by status"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
):
    """
    Get list of markets with optional filters.

    Args:
        category: Filter by category (economia, politica, deportes, tecnologia, crypto)
        status: Filter by status (active, resolved, cancelled)
        limit: Maximum number of results (1-100)
        offset: Pagination offset
        db: Database session

    Returns:
        List of markets
    """
    markets, total = market_service.get_markets(
        db, category=category, status=status, limit=limit, offset=offset
    )

    # Format markets for frontend
    formatted_markets = [market_service.format_market_response(db, m) for m in markets]

    return formatted_markets


@router.get("/{market_id}", response_model=MarketResponse)
def get_market(market_id: int, db: Session = Depends(get_db)):
    """
    Get market by ID.

    Args:
        market_id: Market ID
        db: Database session

    Returns:
        Market details

    Raises:
        404: If market not found
    """
    market = market_service.get_market_by_id(db, market_id)
    return market_service.format_market_response(db, market)


@router.get("/{market_id}/history", response_model=List[MarketHistoryPoint])
def get_market_history(market_id: int, db: Session = Depends(get_db)):
    """
    Get market probability history for charts.

    Args:
        market_id: Market ID
        db: Database session

    Returns:
        List of historical probability points

    Raises:
        404: If market not found
    """
    # Verify market exists
    market_service.get_market_by_id(db, market_id)

    # Get history
    return market_service.get_market_history(db, market_id)
