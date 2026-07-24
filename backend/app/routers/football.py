"""
Football router — public endpoints for fixtures and standings,
plus admin-only sync endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_admin
from app.services import football_service

router = APIRouter(prefix="/api/football", tags=["Football"])


@router.get("/fixtures")
def list_fixtures(season: int = 2026):
    """All fixtures for the WC season (cached)."""
    data = football_service.get_fixtures(season)
    if data is None:
        return []
    return data


@router.get("/fixtures/{match_id}")
def get_fixture(match_id: int):
    """Single fixture detail (cached by status TTL)."""
    data = football_service.get_fixture(match_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return data


@router.get("/standings")
def get_standings(season: int = 2026):
    """Group standings for the WC (cached)."""
    data = football_service.get_standings(season)
    if data is None:
        return []
    return data


@router.post("/admin/sync")
def sync_fixtures(_admin=Depends(get_current_admin), season: int = 2026):
    """Admin-only: force re-sync of all fixtures into DB."""
    count = football_service.sync_fixtures_to_db(season)
    return {"synced": count}
