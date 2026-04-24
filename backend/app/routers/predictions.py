from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.prediction import PredictionCreate, PredictionResponse
from app.services import prediction_service

router = APIRouter()


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def create_prediction(
    prediction_data: PredictionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new prediction (requires authentication).

    This endpoint:
    1. Validates user has enough points
    2. Creates the prediction
    3. Deducts points from user
    4. Updates market probability
    5. Updates market stats

    Args:
        prediction_data: Prediction data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created prediction

    Raises:
        400: If user has insufficient points
        401: If not authenticated
        404: If market not found
    """
    prediction = prediction_service.create_prediction(db, current_user, prediction_data)
    return prediction


@router.get("", response_model=List[PredictionResponse])
def get_user_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current user's prediction history (requires authentication).

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of user's predictions

    Raises:
        401: If not authenticated
    """
    predictions = prediction_service.get_user_predictions(db, current_user.id)
    return predictions


@router.get("/market/{market_id}", response_model=List[PredictionResponse])
def get_market_predictions(market_id: int, db: Session = Depends(get_db)):
    """
    Get all predictions for a specific market.

    Args:
        market_id: Market ID
        db: Database session

    Returns:
        List of market's predictions
    """
    predictions = prediction_service.get_market_predictions(db, market_id)
    return predictions
