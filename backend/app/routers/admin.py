"""
Admin router — protected endpoints for platform metrics and management.
All endpoints require admin role.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import case, distinct, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.activity_log import ActivityLog
from app.models.ai_usage_log import AIUsageLog
from app.models.market import Market, MarketCategory, MarketStatus
from app.models.prediction import Prediction
from app.models.user import User
from app.services import ai_service

# --------------- Request schemas ---------------

class UserRoleUpdate(BaseModel):
    role: str  # 'user' or 'admin'

class UserPointsUpdate(BaseModel):
    points: float
    reason: Optional[str] = None

class MarketResolveRequest(BaseModel):
    resolution_value: bool  # True = YES, False = NO

def _validate_end_date_year(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return value
    max_year = datetime.now().year + 10
    if value.year > max_year:
        raise ValueError(f"El año de cierre no puede ser mayor a {max_year}")
    return value

class MarketEditRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    category: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, value: Optional[datetime]) -> Optional[datetime]:
        return _validate_end_date_year(value)

class MarketCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    type: str = "binary"
    end_date: datetime
    probability: float = 50.0

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, value: datetime) -> datetime:
        return _validate_end_date_year(value)

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)


def _to_naive_utc(dt: datetime) -> datetime:
    """Strip tzinfo (converting to UTC first) so it can be compared with datetime.utcnow()."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


# --------------- Overview ---------------

@router.get("/metrics/overview")
def get_overview(db: Session = Depends(get_db)):
    """Main dashboard KPIs."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Users
    total_users = db.query(func.count(User.id)).scalar()
    new_today = db.query(func.count(User.id)).filter(
        func.date(User.created_at) == today
    ).scalar()
    new_this_week = db.query(func.count(User.id)).filter(
        func.date(User.created_at) >= week_ago
    ).scalar()
    new_this_month = db.query(func.count(User.id)).filter(
        func.date(User.created_at) >= month_ago
    ).scalar()

    # Markets
    total_markets = db.query(func.count(Market.id)).scalar()
    active_markets = db.query(func.count(Market.id)).filter(
        Market.status == MarketStatus.ACTIVE
    ).scalar()
    resolved_markets = db.query(func.count(Market.id)).filter(
        Market.status == MarketStatus.RESOLVED
    ).scalar()

    # Markets by category
    markets_by_cat = dict(
        db.query(Market.category, func.count(Market.id))
        .group_by(Market.category)
        .all()
    )
    by_category = {cat.value: markets_by_cat.get(cat, 0) for cat in MarketCategory}

    # Predictions
    total_predictions = db.query(func.count(Prediction.id)).scalar()
    predictions_today = db.query(func.count(Prediction.id)).filter(
        func.date(Prediction.created_at) == today
    ).scalar()
    predictions_week = db.query(func.count(Prediction.id)).filter(
        func.date(Prediction.created_at) >= week_ago
    ).scalar()
    total_volume = db.query(func.coalesce(func.sum(Prediction.points_wagered), 0)).scalar()
    volume_today = db.query(func.coalesce(func.sum(Prediction.points_wagered), 0)).filter(
        func.date(Prediction.created_at) == today
    ).scalar()

    # AI
    ai_today = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()
    ai_cache_hits_today = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(True),
    ).scalar()
    ai_total_today = ai_today + ai_cache_hits_today
    cache_hit_rate = round(ai_cache_hits_today / ai_total_today, 2) if ai_total_today > 0 else 0
    avg_latency = db.query(func.avg(AIUsageLog.response_time_ms)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()
    quota_used = ai_service.get_daily_usage_count()

    return {
        "users": {
            "total": total_users,
            "new_today": new_today,
            "new_this_week": new_this_week,
            "new_this_month": new_this_month,
        },
        "markets": {
            "total": total_markets,
            "active": active_markets,
            "resolved": resolved_markets,
            "by_category": by_category,
        },
        "predictions": {
            "total": total_predictions,
            "today": predictions_today,
            "this_week": predictions_week,
            "volume_total": float(total_volume),
            "volume_today": float(volume_today),
        },
        "ai": {
            "requests_today": ai_today,
            "cache_hits_today": ai_cache_hits_today,
            "cache_hit_rate": cache_hit_rate,
            "avg_latency_ms": int(avg_latency) if avg_latency else 0,
            "quota_used": quota_used,
            "quota_limit": ai_service.DAILY_QUOTA_LIMIT,
            "quota_remaining": max(0, ai_service.DAILY_QUOTA_LIMIT - quota_used),
        },
    }


# --------------- Users ---------------

@router.get("/users")
def list_users(
    search: str = Query("", description="Search by email or username"),
    role: str = Query("", description="Filter by role"),
    sort_by: str = Query("created_at", description="Sort field: created_at, points, predictions_count, username"),
    order: str = Query("desc", description="asc or desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all users with search, filters, and sorting."""
    query = db.query(User)

    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role == role)

    total = query.count()

    sort_col = {
        "points": User.points,
        "username": User.username,
        "created_at": User.created_at,
    }.get(sort_by, User.created_at)

    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    users = query.offset(offset).limit(limit).all()

    user_ids = [u.id for u in users]
    pred_counts: dict = {}
    if user_ids:
        rows_pc = (
            db.query(Prediction.user_id, func.count(Prediction.id).label("cnt"))
            .filter(Prediction.user_id.in_(user_ids))
            .group_by(Prediction.user_id)
            .all()
        )
        pred_counts = {str(r.user_id): r.cnt for r in rows_pc}

    return {
        "data": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "role": u.role,
                "points": u.points,
                "is_active": u.is_active,
                "predictions_count": pred_counts.get(str(u.id), 0),
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/users/{user_id}")
def get_user_detail(user_id: str, db: Session = Depends(get_db)):
    """Get detailed user info including activity."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found")

    predictions = (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role,
        "points": user.points,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "predictions": [
            {
                "id": str(p.id),
                "market_id": str(p.market_id),
                "probability": float(p.probability),
                "points_wagered": p.points_wagered,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in predictions
        ],
    }


@router.get("/users/{user_id}/stats")
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Prediction stats for a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    preds = db.query(Prediction).filter(Prediction.user_id == user_id).all()

    won = [p for p in preds if p.status == "won"]
    lost = [p for p in preds if p.status == "lost"]
    pending = [p for p in preds if p.status == "pending"]

    points_won = sum(
        round(p.points_wagered / ((p.probability_at_bet or 50) / 100), 2) - p.points_wagered
        for p in won
    )
    points_lost = sum(p.points_wagered for p in lost)

    from collections import Counter
    if preds:
        markets = db.query(Market).filter(
            Market.id.in_([p.market_id for p in preds])
        ).all()
        market_cats = {str(m.id): m.category.value for m in markets}
        cat_counts = Counter(market_cats.get(str(p.market_id), "unknown") for p in preds)
        favorite_category = cat_counts.most_common(1)[0][0] if cat_counts else None
    else:
        favorite_category = None

    return {
        "total_predictions": len(preds),
        "won": len(won),
        "lost": len(lost),
        "pending": len(pending),
        "points_won": round(points_won, 2),
        "points_lost": round(points_lost, 2),
        "net": round(points_won - points_lost, 2),
        "favorite_category": favorite_category,
    }


# --------------- Markets ---------------

@router.get("/metrics/markets/ranking")
def get_markets_ranking(
    sort: str = Query(
        "most_active",
        description="most_active, least_active, most_volume, most_participants",
    ),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get markets ranked by activity (single query with subquery for prediction counts)."""
    from sqlalchemy import outerjoin, label
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    pred_count_subq = (
        db.query(
            Prediction.market_id,
            func.count(Prediction.id).label("pred_count"),
        )
        .group_by(Prediction.market_id)
        .subquery()
    )

    rows = (
        db.query(
            Market,
            func.coalesce(pred_count_subq.c.pred_count, 0).label("pred_count"),
        )
        .outerjoin(pred_count_subq, Market.id == pred_count_subq.c.market_id)
        .filter(Market.status == MarketStatus.ACTIVE)
        .all()
    )

    sort_col = {
        "most_active": lambda x: -x[1],
        "least_active": lambda x: x[1],
        "most_volume": lambda x: -float(x[0].volume),
        "most_participants": lambda x: -x[0].participants_count,
    }.get(sort, lambda x: -x[1])

    rows.sort(key=sort_col)

    return [
        {
            "id": str(m.id),
            "title": m.title,
            "category": m.category.value,
            "probability": float(m.probability_market),
            "predictions_count": int(pred_count),
            "volume": float(m.volume),
            "participants": m.participants_count,
            "end_date": m.end_date.isoformat() if m.end_date else None,
        }
        for m, pred_count in rows[:limit]
    ]


# --------------- Predictions ---------------

@router.get("/metrics/predictions/daily")
def get_predictions_daily(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Get daily prediction counts for charts."""
    start_date = date.today() - timedelta(days=days)

    daily = (
        db.query(
            func.date(Prediction.created_at).label("day"),
            func.count(Prediction.id).label("count"),
            func.coalesce(func.sum(Prediction.points_wagered), 0).label("volume"),
        )
        .filter(func.date(Prediction.created_at) >= start_date)
        .group_by(func.date(Prediction.created_at))
        .order_by(func.date(Prediction.created_at))
        .all()
    )

    return [
        {"date": str(row.day), "count": row.count, "volume": float(row.volume)}
        for row in daily
    ]


# --------------- AI Metrics ---------------

@router.get("/ai/usage/summary")
def get_ai_usage_summary(db: Session = Depends(get_db)):
    """AI/LLM usage summary with quota info."""
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Today stats
    today_requests = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()
    today_cache_hits = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(True),
    ).scalar()
    today_tokens = db.query(func.coalesce(func.sum(AIUsageLog.total_tokens), 0)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()
    today_avg_latency = db.query(func.avg(AIUsageLog.response_time_ms)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()

    # Week stats
    week_requests = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) >= week_ago,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()
    week_tokens = db.query(func.coalesce(func.sum(AIUsageLog.total_tokens), 0)).filter(
        func.date(AIUsageLog.created_at) >= week_ago,
        AIUsageLog.cache_hit.is_(False),
        AIUsageLog.status == "success",
    ).scalar()

    # Errors
    today_errors = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.status == "error",
    ).scalar()
    today_rate_limited = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.status == "rate_limited",
    ).scalar()
    week_rate_limited = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) >= week_ago,
        AIUsageLog.status == "rate_limited",
    ).scalar()

    # Top markets analyzed
    top_markets = (
        db.query(
            AIUsageLog.market_id,
            func.count(AIUsageLog.id).label("analysis_count"),
        )
        .filter(AIUsageLog.market_id.isnot(None))
        .group_by(AIUsageLog.market_id)
        .order_by(func.count(AIUsageLog.id).desc())
        .limit(5)
        .all()
    )

    top_market_ids = [row.market_id for row in top_markets]
    markets_map: dict = {}
    if top_market_ids:
        markets_fetched = db.query(Market).filter(Market.id.in_(top_market_ids)).all()
        markets_map = {str(m.id): m for m in markets_fetched}

    top_markets_data = []
    for row in top_markets:
        market = markets_map.get(str(row.market_id))
        top_markets_data.append({
            "market_id": str(row.market_id),
            "title": market.title if market else "Unknown",
            "analysis_count": row.analysis_count,
        })

    quota_used = ai_service.get_daily_usage_count()

    return {
        "today": {
            "requests": today_requests,
            "cache_hits": today_cache_hits,
            "tokens": int(today_tokens),
            "avg_latency_ms": int(today_avg_latency) if today_avg_latency else 0,
            "errors": today_errors,
            "rate_limited": today_rate_limited,
        },
        "this_week": {
            "requests": week_requests,
            "tokens": int(week_tokens),
            "rate_limited": week_rate_limited,
        },
        "quota": {
            "daily_limit": ai_service.DAILY_QUOTA_LIMIT,
            "used_today": quota_used,
            "remaining": max(0, ai_service.DAILY_QUOTA_LIMIT - quota_used),
            "usage_percent": round(quota_used / ai_service.DAILY_QUOTA_LIMIT * 100, 1),
        },
        "cache_hit_rate": round(
            today_cache_hits / (today_requests + today_cache_hits), 2
        ) if (today_requests + today_cache_hits) > 0 else 0,
        "top_markets_analyzed": top_markets_data,
    }


@router.get("/ai/usage/history")
def get_ai_usage_history(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Daily AI usage for charts."""
    start_date = date.today() - timedelta(days=days)

    daily = (
        db.query(
            func.date(AIUsageLog.created_at).label("day"),
            func.count(case((
                AIUsageLog.cache_hit.is_(False) & (AIUsageLog.status == "success"),
                1,
            ))).label("requests"),
            func.count(case((AIUsageLog.cache_hit.is_(True), 1))).label("cache_hits"),
            func.count(case((AIUsageLog.status == "rate_limited", 1))).label("rate_limited"),
            func.coalesce(func.sum(
                case((
                    AIUsageLog.cache_hit.is_(False) & (AIUsageLog.status == "success"),
                    AIUsageLog.total_tokens,
                ), else_=0)
            ), 0).label("tokens"),
        )
        .filter(func.date(AIUsageLog.created_at) >= start_date)
        .group_by(func.date(AIUsageLog.created_at))
        .order_by(func.date(AIUsageLog.created_at))
        .all()
    )

    return [
        {
            "date": str(row.day),
            "requests": row.requests,
            "cache_hits": row.cache_hits,
            "rate_limited": row.rate_limited,
            "tokens": int(row.tokens),
        }
        for row in daily
    ]


# --------------- User Engagement ---------------

@router.get("/metrics/users/top-active")
def get_top_active_users(
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Top most active users by prediction count in the given period."""
    start_date = date.today() - timedelta(days=days)

    top = (
        db.query(
            Prediction.user_id,
            func.count(Prediction.id).label("predictions_count"),
            func.coalesce(func.sum(Prediction.points_wagered), 0).label("total_wagered"),
        )
        .filter(func.date(Prediction.created_at) >= start_date)
        .group_by(Prediction.user_id)
        .order_by(func.count(Prediction.id).desc())
        .limit(limit)
        .all()
    )

    top_user_ids = [row.user_id for row in top]
    users_map: dict = {}
    if top_user_ids:
        users_fetched = db.query(User).filter(User.id.in_(top_user_ids)).all()
        users_map = {str(u.id): u for u in users_fetched}

    result = []
    for row in top:
        user = users_map.get(str(row.user_id))
        if user:
            result.append({
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "predictions_count": row.predictions_count,
                "total_wagered": float(row.total_wagered),
                "points": user.points,
            })
    return result


@router.get("/metrics/users/inactive")
def get_inactive_users(
    days: int = Query(30, description="Users with no predictions in X days"),
    db: Session = Depends(get_db),
):
    """Users who registered but have no predictions in the given period."""
    cutoff = date.today() - timedelta(days=days)

    active_user_ids = (
        db.query(distinct(Prediction.user_id))
        .filter(func.date(Prediction.created_at) >= cutoff)
        .subquery()
    )

    inactive = (
        db.query(User)
        .filter(User.id.notin_(active_user_ids))
        .filter(User.role != "admin")
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "points": u.points,
            "total_predictions": len(u.predictions),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in inactive
    ]


@router.get("/metrics/users/engagement")
def get_user_engagement(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    """Engagement metrics: activity by hour and day of week."""
    start_date = date.today() - timedelta(days=days)

    by_hour = (
        db.query(
            func.extract("hour", ActivityLog.created_at).label("hour"),
            func.count(ActivityLog.id).label("count"),
        )
        .filter(func.date(ActivityLog.created_at) >= start_date)
        .group_by(func.extract("hour", ActivityLog.created_at))
        .order_by(func.extract("hour", ActivityLog.created_at))
        .all()
    )

    by_dow = (
        db.query(
            func.extract("dow", ActivityLog.created_at).label("dow"),
            func.count(ActivityLog.id).label("count"),
        )
        .filter(func.date(ActivityLog.created_at) >= start_date)
        .group_by(func.extract("dow", ActivityLog.created_at))
        .order_by(func.extract("dow", ActivityLog.created_at))
        .all()
    )

    dow_names = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

    return {
        "by_hour": [{"hour": int(r.hour), "count": r.count} for r in by_hour],
        "by_day_of_week": [
            {"day": dow_names[int(r.dow)], "count": r.count} for r in by_dow
        ],
    }


# --------------- Category Interest ---------------

@router.get("/metrics/categories/interest")
def get_category_interest(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Category engagement: predictions and volume by category."""
    start_date = date.today() - timedelta(days=days)

    results = (
        db.query(
            Market.category,
            func.count(Prediction.id).label("predictions_count"),
            func.coalesce(func.sum(Prediction.points_wagered), 0).label("volume"),
            func.count(distinct(Prediction.user_id)).label("unique_users"),
        )
        .join(Prediction, Prediction.market_id == Market.id)
        .filter(func.date(Prediction.created_at) >= start_date)
        .group_by(Market.category)
        .order_by(func.count(Prediction.id).desc())
        .all()
    )

    return [
        {
            "category": row.category.value,
            "predictions_count": row.predictions_count,
            "volume": float(row.volume),
            "unique_users": row.unique_users,
        }
        for row in results
    ]


# --------------- Site Performance ---------------

@router.get("/metrics/performance")
def get_site_performance(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    """API performance metrics: response times, error rates, top endpoints."""
    start_date = date.today() - timedelta(days=days)

    base_q = db.query(ActivityLog).filter(
        func.date(ActivityLog.created_at) >= start_date,
        ActivityLog.action == "api_request",
    )

    total_requests = base_q.count()
    errors_4xx = base_q.filter(
        ActivityLog.status_code >= 400, ActivityLog.status_code < 500
    ).count()
    errors_5xx = base_q.filter(ActivityLog.status_code >= 500).count()

    response_times = (
        db.query(ActivityLog.response_time_ms)
        .filter(
            func.date(ActivityLog.created_at) >= start_date,
            ActivityLog.action == "api_request",
            ActivityLog.response_time_ms.isnot(None),
        )
        .order_by(ActivityLog.response_time_ms)
        .all()
    )
    times = [r.response_time_ms for r in response_times]

    p50 = times[len(times) // 2] if times else 0
    p95 = times[int(len(times) * 0.95)] if times else 0
    p99 = times[int(len(times) * 0.99)] if times else 0
    avg_time = sum(times) / len(times) if times else 0

    slowest = (
        db.query(
            ActivityLog.endpoint,
            func.avg(ActivityLog.response_time_ms).label("avg_ms"),
            func.count(ActivityLog.id).label("count"),
        )
        .filter(
            func.date(ActivityLog.created_at) >= start_date,
            ActivityLog.action == "api_request",
            ActivityLog.response_time_ms.isnot(None),
        )
        .group_by(ActivityLog.endpoint)
        .order_by(func.avg(ActivityLog.response_time_ms).desc())
        .limit(10)
        .all()
    )

    most_hit = (
        db.query(
            ActivityLog.endpoint,
            func.count(ActivityLog.id).label("count"),
            func.avg(ActivityLog.response_time_ms).label("avg_ms"),
        )
        .filter(
            func.date(ActivityLog.created_at) >= start_date,
            ActivityLog.action == "api_request",
        )
        .group_by(ActivityLog.endpoint)
        .order_by(func.count(ActivityLog.id).desc())
        .limit(10)
        .all()
    )

    daily_perf = (
        db.query(
            func.date(ActivityLog.created_at).label("day"),
            func.count(ActivityLog.id).label("total"),
            func.count(case((ActivityLog.status_code >= 400, 1))).label("errors"),
        )
        .filter(
            func.date(ActivityLog.created_at) >= start_date,
            ActivityLog.action == "api_request",
        )
        .group_by(func.date(ActivityLog.created_at))
        .order_by(func.date(ActivityLog.created_at))
        .all()
    )

    return {
        "summary": {
            "total_requests": total_requests,
            "errors_4xx": errors_4xx,
            "errors_5xx": errors_5xx,
            "error_rate": (
                round((errors_4xx + errors_5xx) / total_requests * 100, 2)
                if total_requests > 0
                else 0
            ),
            "avg_response_ms": int(avg_time),
            "p50_ms": p50,
            "p95_ms": p95,
            "p99_ms": p99,
        },
        "slowest_endpoints": [
            {"endpoint": r.endpoint, "avg_ms": int(r.avg_ms), "count": r.count}
            for r in slowest
        ],
        "most_hit_endpoints": [
            {"endpoint": r.endpoint, "count": r.count, "avg_ms": int(r.avg_ms) if r.avg_ms else 0}
            for r in most_hit
        ],
        "daily": [
            {"date": str(r.day), "total": r.total, "errors": r.errors}
            for r in daily_perf
        ],
    }


# --------------- Activity Feed ---------------

@router.get("/activity/recent")
def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Recent activity feed — latest actions across the platform."""
    recent_predictions = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(limit)
        .all()
    )

    pred_user_ids = list({p.user_id for p in recent_predictions})
    pred_market_ids = list({p.market_id for p in recent_predictions})

    users_by_id: dict = {}
    if pred_user_ids:
        fetched_users = db.query(User).filter(User.id.in_(pred_user_ids)).all()
        users_by_id = {str(u.id): u for u in fetched_users}

    markets_by_id: dict = {}
    if pred_market_ids:
        fetched_markets = db.query(Market).filter(Market.id.in_(pred_market_ids)).all()
        markets_by_id = {str(m.id): m for m in fetched_markets}

    feed = []
    for p in recent_predictions:
        user = users_by_id.get(str(p.user_id))
        market = markets_by_id.get(str(p.market_id))
        feed.append({
            "type": "prediction",
            "user": user.username if user else "unknown",
            "action": f"predijo {p.probability}% en",
            "target": market.title if market else "mercado desconocido",
            "points": p.points_wagered,
            "timestamp": p.created_at.isoformat() if p.created_at else None,
        })

    feed.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return feed[:limit]


# --------------- User Management Actions ---------------

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, db: Session = Depends(get_db)):
    """Ban or unban a user by toggling is_active."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "is_active": user.is_active}


@router.patch("/users/{user_id}/role")
def update_user_role(user_id: str, body: UserRoleUpdate, db: Session = Depends(get_db)):
    """Change a user's role (user / admin)."""
    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido. Use 'user' o 'admin'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "role": user.role}


@router.patch("/users/{user_id}/points")
def update_user_points(user_id: str, body: UserPointsUpdate, db: Session = Depends(get_db)):
    """Adjust a user's points balance. No-op if the new value matches the current one."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.points == body.points:
        return {"id": str(user.id), "points": user.points, "changed": False}
    user.points = body.points
    db.commit()
    db.refresh(user)
    return {"id": str(user.id), "points": user.points, "changed": True}


# --------------- Market Management Actions ---------------

@router.post("/markets/{market_id}/resolve")
def resolve_market(market_id: str, body: MarketResolveRequest, db: Session = Depends(get_db)):
    """
    Resolve a market with YES (True) or NO (False).

    Payout logic (fee=0 MVP):
      - winner prediction: user receives points_wagered / (probability_at_bet / 100)
        i.e. they get back their stake plus the gain
      - loser prediction: points were already deducted at bet time, nothing extra
      - predictions without probability_at_bet (legacy): refunded at 1:1
    """
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    if market.status != MarketStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Solo se pueden resolver mercados activos")

    market.status = MarketStatus.RESOLVED
    market.resolution_value = body.resolution_value
    market.resolved_at = datetime.utcnow()

    # Pay out winners
    predictions = db.query(Prediction).filter(
        Prediction.market_id == market.id,
        Prediction.status == "pending",
    ).all()

    winners = 0
    losers = 0
    total_paid = 0.0

    for pred in predictions:
        # A prediction is "correct" if the user predicted > 50% and result is YES,
        # or predicted <= 50% and result is NO.
        user_said_yes = pred.probability > 50
        outcome_yes = body.resolution_value

        if user_said_yes == outcome_yes:
            pred.status = "won"
            prob = pred.probability_at_bet if pred.probability_at_bet and pred.probability_at_bet > 0 else 50.0
            payout = round(pred.points_wagered / (prob / 100.0), 2)
            pred.user.points = round(pred.user.points + payout, 2)
            total_paid += payout
            winners += 1
        else:
            pred.status = "lost"
            losers += 1

    db.commit()
    db.refresh(market)
    return {
        "id": str(market.id),
        "status": market.status,
        "resolution_value": market.resolution_value,
        "resolved_at": market.resolved_at.isoformat(),
        "winners": winners,
        "losers": losers,
        "total_paid_pts": round(total_paid, 2),
    }


@router.post("/markets/{market_id}/unresolve")
def unresolve_market(market_id: str, db: Session = Depends(get_db)):
    """Revert a resolved market back to active, undoing payouts to winners."""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    if market.status != MarketStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Solo se pueden revertir mercados resueltos")

    reverted = 0
    points_adjusted = 0.0

    predictions = db.query(Prediction).filter(Prediction.market_id == market.id).all()
    for pred in predictions:
        if pred.status == "won":
            prob = pred.probability_at_bet if pred.probability_at_bet and pred.probability_at_bet > 0 else 50.0
            payout = round(pred.points_wagered / (prob / 100.0), 2)
            pred.user.points = round(pred.user.points - payout, 2)
            points_adjusted += payout
            pred.status = "pending"
            reverted += 1
        elif pred.status == "lost":
            pred.status = "pending"

    market.status = MarketStatus.ACTIVE
    market.resolution_value = None
    market.resolved_at = None
    db.commit()

    return {
        "id": str(market.id),
        "status": market.status,
        "reverted_predictions": reverted,
        "points_adjusted": round(points_adjusted, 2),
    }


@router.post("/markets/{market_id}/cancel")
def cancel_market(market_id: str, db: Session = Depends(get_db)):
    """Cancel an active market."""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    if market.status != MarketStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar mercados activos")
    market.status = MarketStatus.CANCELLED
    db.commit()
    db.refresh(market)
    return {"id": str(market.id), "status": market.status}


@router.patch("/markets/{market_id}")
def edit_market(market_id: str, body: MarketEditRequest, db: Session = Depends(get_db)):
    """Edit market title, description or end date."""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    if body.title is not None:
        market.title = body.title
    if body.description is not None:
        market.description = body.description
    if body.end_date is not None:
        end_date = _to_naive_utc(body.end_date)
        if end_date <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="La fecha de cierre debe ser posterior a ahora")
        market.end_date = end_date
    if body.category is not None:
        try:
            market.category = MarketCategory(body.category.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Categoría inválida: {body.category}")
    db.commit()
    db.refresh(market)
    return {
        "id": str(market.id),
        "title": market.title,
        "description": market.description,
        "category": market.category,
        "end_date": market.end_date.isoformat(),
    }


@router.post("/markets")
def create_market(body: MarketCreateRequest, db: Session = Depends(get_db)):
    """Create a new market/poll."""
    if not (1 <= body.probability <= 99):
        raise HTTPException(status_code=400, detail="La probabilidad debe estar entre 1% y 99%")

    end_date = _to_naive_utc(body.end_date)
    if end_date <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="La fecha de cierre debe ser posterior a ahora")

    try:
        category = MarketCategory(body.category.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Categoría inválida: {body.category}")

    from app.models.market import MarketType as MT
    try:
        market_type = MT(body.type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Tipo inválido: {body.type}")

    market = Market(
        title=body.title,
        description=body.description,
        category=category,
        type=market_type,
        end_date=end_date,
        probability_market=body.probability,
        status=MarketStatus.ACTIVE,
    )
    db.add(market)
    db.commit()
    db.refresh(market)
    return {
        "id": str(market.id),
        "title": market.title,
        "category": market.category,
        "type": market.type,
        "status": market.status,
        "end_date": market.end_date.isoformat(),
        "probability": float(market.probability_market),
    }


@router.delete("/markets/{market_id}")
def delete_market(market_id: str, db: Session = Depends(get_db)):
    """Delete a market and all its predictions (CASCADE)."""
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Mercado no encontrado")
    predictions_count = db.query(Prediction).filter(Prediction.market_id == market.id).count()
    db.delete(market)
    db.commit()
    return {"id": market_id, "deleted": True, "predictions_deleted": predictions_count}


@router.post("/markets/expire-past")
def expire_past_markets(db: Session = Depends(get_db)):
    """Cancel all active markets whose end_date has already passed."""
    now = datetime.utcnow()
    expired = db.query(Market).filter(
        Market.status == MarketStatus.ACTIVE,
        Market.end_date < now,
    ).all()

    count = len(expired)
    for market in expired:
        market.status = MarketStatus.CANCELLED

    db.commit()
    return {"expired": count, "message": f"{count} mercado(s) expirado(s) cancelados"}

