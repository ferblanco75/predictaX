from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, InsufficientPointsException
from app.models.market import MarketStatus
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreate
from app.services import market_service, referral_service, snapshot_service


def calculate_market_probability(predictions: List[Prediction]) -> float:
    """
    Calculate market probability as the ratio of points bet on YES over total points.

    A prediction is YES if probability > 50 (frontend sends 75), NO otherwise (25).
    This produces the full [0, 100] range instead of the old weighted-average
    approach which was mathematically capped at [25, 75].

    Args:
        predictions: List of predictions for a market

    Returns:
        Probability in [0, 100]. Returns 50.0 if there are no bets.
    """
    if not predictions:
        return 50.0

    total_points = sum(p.points_wagered for p in predictions)

    if total_points == 0:
        return 50.0

    yes_points = sum(p.points_wagered for p in predictions if p.probability > 50)
    return round(yes_points / total_points * 100, 2)


# Probability band used for payouts. A market pushed to 0% or 100% would
# otherwise produce an unbounded multiplier for the opposite side.
MIN_PAYOUT_PROBABILITY = 1.0
MAX_PAYOUT_PROBABILITY = 99.0


def calculate_payout(
    points_wagered: float, probability_at_bet: float, bet_probability: float
) -> float:
    """
    Payout a winning prediction collects, stake included (fee=0 MVP).

    The divisor is the market probability of the side actually bet on: the YES
    probability for a YES bet (probability > 50), its complement for a NO bet.
    Using the YES probability for both sides made betting both ways on a skewed
    market pay more than the combined stake, whatever the resolution.

    Args:
        points_wagered: Points staked on the prediction
        probability_at_bet: Market YES probability when the bet was placed
        bet_probability: Probability the user bet, > 50 is YES, < 50 is NO

    Returns:
        Points the winner receives, rounded to 2 decimals
    """
    prob = min(max(probability_at_bet, MIN_PAYOUT_PROBABILITY), MAX_PAYOUT_PROBABILITY)
    side_probability = prob if bet_probability > 50 else 100.0 - prob
    return round(points_wagered / (side_probability / 100.0), 2)


def lock_user_balances(db: Session, user_ids: Iterable[UUID]) -> Dict[UUID, User]:
    """
    Lock the given user rows for the rest of the transaction (#276).

    Every path that moves points takes this lock before reading a balance, so a
    bet, a refund and an unresolve can never all read the same balance and write
    over each other. Rows are locked in id order so two callers touching the same
    set of users queue up instead of deadlocking.

    Args:
        db: Database session
        user_ids: Users whose balance is about to be read and written

    Returns:
        The locked users, keyed by id, with their columns refreshed from the row
        that was locked (a stale identity-map value would defeat the lock)
    """
    ids = sorted(set(user_ids), key=str)
    if not ids:
        return {}

    users = (
        db.query(User)
        .filter(User.id.in_(ids))
        .order_by(User.id)
        .with_for_update()
        .populate_existing()
        .all()
    )
    return {u.id: u for u in users}


def refund_market_predictions(db: Session, market_id: UUID) -> Tuple[int, float]:
    """
    Give every open bet on a market its stake back (#281).

    Used when a market ends without resolving — cancelled by an admin or expired
    past its end date. Until this existed both paths only flipped the market
    status, leaving the predictions `pending` and the points debited at bet time
    gone for good.

    Only `pending` predictions are refunded, so calling this twice on the same
    market is a no-op the second time. Does not commit: the caller decides the
    transaction boundary (expire-past refunds many markets at once).

    Args:
        db: Database session
        market_id: Market whose open bets are being returned

    Returns:
        (number of predictions refunded, total points returned)
    """
    predictions = (
        db.query(Prediction)
        .filter(Prediction.market_id == market_id, Prediction.status == "pending")
        .all()
    )
    if not predictions:
        return 0, 0.0

    totals: Dict[UUID, float] = defaultdict(float)
    for pred in predictions:
        totals[pred.user_id] += pred.points_wagered

    users = lock_user_balances(db, totals.keys())
    for user_id, amount in totals.items():
        user = users.get(user_id)
        if user is not None:
            user.points = round(user.points + amount, 2)

    for pred in predictions:
        pred.status = "refunded"

    return len(predictions), round(sum(totals.values()), 2)


def create_prediction(
    db: Session, user: User, prediction_data: PredictionCreate
) -> Prediction:
    """
    Create a new prediction.

    This function:
    0. Locks the user's balance row for the transaction (#276)
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
    # #276: lock the balance before reading it. The check here and the debit
    # further down are not one statement, so without the lock two concurrent
    # bets both pass against the same balance and the account ends up negative.
    lock_user_balances(db, [user.id])

    # Validate user has enough points
    if user.points + 0.01 < prediction_data.points_wagered:
        raise InsufficientPointsException(
            f"Puntos insuficientes. Tenés {int(user.points)} pts, "
            f"necesitás {int(prediction_data.points_wagered)} pts"
        )

    # Get market
    market = market_service.get_market_by_id(db, prediction_data.market_id)

    # Validate market is still open
    if market.status != MarketStatus.ACTIVE:
        raise BadRequestException("Este mercado ya no está activo")

    if market.end_date and market.end_date.replace(tzinfo=timezone.utc) < datetime.now(
        timezone.utc
    ):
        raise BadRequestException("Este mercado ya cerró")

    # Store old probability for snapshot comparison
    old_probability = float(market.probability_market)

    # Capture market probability at bet time (used for payout calculation on resolve)
    prob_at_bet = float(market.probability_market)

    # potential_gain = payout if winner - amount wagered (fee=0 for MVP)
    potential_gain = (
        calculate_payout(
            prediction_data.points_wagered, prob_at_bet, prediction_data.probability
        )
        - prediction_data.points_wagered
    )

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

    # Deduct points from user. Clamped because the check above allows a 0.01
    # float-fuzz overdraw, which would otherwise leave a sliver of a negative
    # balance and trip the ck_users_points_non_negative constraint.
    user.points = max(round(user.points - prediction_data.points_wagered, 2), 0.0)

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

    # Award referrer bonus on the referred user's first prediction
    user_prediction_count = (
        db.query(Prediction).filter(Prediction.user_id == user.id).count()
    )
    if user_prediction_count == 1:
        referral_service.award_referrer_bonus_if_eligible(db, user)

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


def get_market_predictions(
    db: Session, market_id: UUID, limit: int = 50, offset: int = 0
) -> List[Prediction]:
    """
    Get a page of predictions for a market (#260: this is a public,
    unauthenticated endpoint — must never return an unbounded result set).

    Args:
        db: Database session
        market_id: Market ID
        limit: Maximum number of predictions to return
        offset: Pagination offset

    Returns:
        Page of predictions
    """
    return (
        db.query(Prediction)
        .filter(Prediction.market_id == market_id)
        .order_by(Prediction.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
