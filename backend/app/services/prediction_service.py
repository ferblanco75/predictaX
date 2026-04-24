from typing import List

from sqlalchemy.orm import Session

from app.core.exceptions import InsufficientPointsException
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreate
from app.services import market_service, snapshot_service


def calculate_market_probability(predictions: List[Prediction]) -> float:
    """
    Calculate market probability as weighted average of all predictions.

    Args:
        predictions: List of predictions for a market

    Returns:
        Weighted average probability (0-100)
    """
    if not predictions:
        return 50.0  # Default to 50% if no predictions

    total_points = sum(p.points_wagered for p in predictions)

    if total_points == 0:
        return 50.0

    weighted_prob = sum(p.probability * p.points_wagered for p in predictions)
    return weighted_prob / total_points


def create_prediction(
    db: Session, user: User, prediction_data: PredictionCreate
) -> Prediction:
    """
    Create a new prediction.

    This function:
    1. Validates user has enough points
    2. Creates the prediction
    3. Deducts points from user
    4. Updates market probability
    5. Updates market stats (volume, participants)
    6. Creates snapshot if probability changed significantly

    Args:
        db: Database session
        user: User making the prediction
        prediction_data: Prediction data

    Returns:
        Created prediction

    Raises:
        InsufficientPointsException: If user doesn't have enough points
        NotFoundException: If market not found
    """
    # Validate user has enough points
    if user.points < prediction_data.points_wagered:
        raise InsufficientPointsException(
            f"Insufficient points. You have {user.points}, need {prediction_data.points_wagered}"
        )

    # Get market
    market = market_service.get_market_by_id(db, prediction_data.market_id)

    # Store old probability for snapshot comparison
    old_probability = market.probability_market

    # Create prediction
    prediction = Prediction(
        user_id=user.id,
        market_id=prediction_data.market_id,
        probability=prediction_data.probability,
        points_wagered=prediction_data.points_wagered,
    )

    db.add(prediction)

    # Deduct points from user
    user.points -= prediction_data.points_wagered

    # Recalculate market probability
    all_predictions = (
        db.query(Prediction)
        .filter(Prediction.market_id == prediction_data.market_id)
        .all()
    )
    all_predictions.append(prediction)  # Include the new one

    new_probability = calculate_market_probability(all_predictions)
    market.probability_market = new_probability

    # Update market stats
    market_service.update_market_stats(db, market.id)

    # Commit changes
    db.commit()
    db.refresh(prediction)

    # Create snapshot if probability changed significantly (>1%)
    if abs(new_probability - old_probability) > 1.0:
        snapshot_service.create_snapshot(db, market.id, new_probability)

    return prediction


def get_user_predictions(db: Session, user_id: int) -> List[Prediction]:
    """
    Get all predictions for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        List of predictions
    """
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )


def get_market_predictions(db: Session, market_id: int) -> List[Prediction]:
    """
    Get all predictions for a market.

    Args:
        db: Database session
        market_id: Market ID

    Returns:
        List of predictions
    """
    return (
        db.query(Prediction)
        .filter(Prediction.market_id == market_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
