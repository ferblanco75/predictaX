"""
Admin router — protected endpoints for platform metrics and management.
All endpoints require admin role.
"""

from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.models.market import Market, MarketStatus, MarketCategory
from app.models.prediction import Prediction
from app.models.ai_usage_log import AIUsageLog
from app.services import ai_service

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)


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
        AIUsageLog.cache_hit == False,
    ).scalar()
    ai_cache_hits_today = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit == True,
    ).scalar()
    ai_total_today = ai_today + ai_cache_hits_today
    cache_hit_rate = round(ai_cache_hits_today / ai_total_today, 2) if ai_total_today > 0 else 0
    avg_latency = db.query(func.avg(AIUsageLog.response_time_ms)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit == False,
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
            "quota_limit": 250,
            "quota_remaining": max(0, 250 - quota_used),
        },
    }


# --------------- Users ---------------

@router.get("/users")
def list_users(
    search: str = Query("", description="Search by email or username"),
    role: str = Query("", description="Filter by role"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all users with search and filters."""
    query = db.query(User)

    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "data": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "role": u.role,
                "points": u.points,
                "is_active": u.is_active,
                "predictions_count": len(u.predictions),
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


# --------------- Markets ---------------

@router.get("/metrics/markets/ranking")
def get_markets_ranking(
    sort: str = Query("most_active", description="most_active, least_active, most_volume, most_participants"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get markets ranked by activity."""
    markets = db.query(Market).filter(Market.status == MarketStatus.ACTIVE).all()

    result = []
    for m in markets:
        pred_count = db.query(func.count(Prediction.id)).filter(
            Prediction.market_id == m.id
        ).scalar()
        result.append({
            "id": str(m.id),
            "title": m.title,
            "category": m.category.value,
            "probability": float(m.probability_market),
            "predictions_count": pred_count,
            "volume": float(m.volume),
            "participants": m.participants_count,
            "end_date": m.end_date.isoformat() if m.end_date else None,
        })

    sort_key = {
        "most_active": lambda x: -x["predictions_count"],
        "least_active": lambda x: x["predictions_count"],
        "most_volume": lambda x: -x["volume"],
        "most_participants": lambda x: -x["participants"],
    }.get(sort, lambda x: -x["predictions_count"])

    result.sort(key=sort_key)
    return result[:limit]


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
        AIUsageLog.cache_hit == False,
    ).scalar()
    today_cache_hits = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit == True,
    ).scalar()
    today_tokens = db.query(func.coalesce(func.sum(AIUsageLog.total_tokens), 0)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit == False,
    ).scalar()
    today_avg_latency = db.query(func.avg(AIUsageLog.response_time_ms)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.cache_hit == False,
        AIUsageLog.status == "success",
    ).scalar()

    # Week stats
    week_requests = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) >= week_ago,
        AIUsageLog.cache_hit == False,
    ).scalar()
    week_tokens = db.query(func.coalesce(func.sum(AIUsageLog.total_tokens), 0)).filter(
        func.date(AIUsageLog.created_at) >= week_ago,
        AIUsageLog.cache_hit == False,
    ).scalar()

    # Errors
    today_errors = db.query(func.count(AIUsageLog.id)).filter(
        func.date(AIUsageLog.created_at) == today,
        AIUsageLog.status == "error",
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

    top_markets_data = []
    for row in top_markets:
        market = db.query(Market).filter(Market.id == row.market_id).first()
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
        },
        "this_week": {
            "requests": week_requests,
            "tokens": int(week_tokens),
        },
        "quota": {
            "daily_limit": 250,
            "used_today": quota_used,
            "remaining": max(0, 250 - quota_used),
            "usage_percent": round(quota_used / 250 * 100, 1),
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
            func.count(case((AIUsageLog.cache_hit == False, 1))).label("requests"),
            func.count(case((AIUsageLog.cache_hit == True, 1))).label("cache_hits"),
            func.coalesce(func.sum(
                case((AIUsageLog.cache_hit == False, AIUsageLog.total_tokens), else_=0)
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
            "tokens": int(row.tokens),
        }
        for row in daily
    ]
