from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/leaderboard", response_model=List[UserResponse])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=100, description="Number of top users"),
    db: Session = Depends(get_db),
):
    """
    Get top users by points (leaderboard).

    Args:
        limit: Number of top users to return
        db: Database session

    Returns:
        List of top users ordered by points
    """
    users = (
        db.query(User)
        .order_by(User.points.desc())
        .limit(limit)
        .all()
    )

    return users
