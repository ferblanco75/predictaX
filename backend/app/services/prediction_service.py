from typing import List
from uuid import UUID

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
    old_probability = float(market.probability_market)

    # Capture market probability at bet time (used for payout calculation on resolve)
    prob_at_bet = float(market.probability_market)

    # potential_gain = payout if winner - amount wagered
    # payout = points_wagered / (probability_at_bet / 100)
    # Using fee=0 for MVP
    if prob_at_bet > 0:
        potential_gain = (prediction_data.points_wagered / (prob_at_bet / 100)) - prediction_data.points_wagered
    else:
        potential_gain = 0.0

    # Create prediction
    prediction = Prediction(
        user_id=user.id,
        market_id=prediction_data.market_id,
        probability=prediction_data.probability,
        probability_at_bet=prob_at_bet,
        points_wagered=prediction_data.points_wagered,
        potential_gain=round(potential_gain, 2),
    )

    db.add(prediction)
    db.flush()

    # Deduct points from user
    user.points -= prediction_data.points_wagered

    # Recalculate market probability
    all_predictions = (
        db.query(Prediction)
        .filter(Prediction.market_id == prediction_data.market_id)
        .all()
    )

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


def get_user_predictions(db: Session, user_id: UUID) -> List[Prediction]:
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


def get_market_predictions(db: Session, market_id: UUID) -> List[Prediction]:
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
