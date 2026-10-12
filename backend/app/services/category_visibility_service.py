import logging
import uuid

from sqlalchemy.orm import Session

from app.models.category_visibility import CategoryVisibility
from app.models.market import MarketCategory

logger = logging.getLogger(__name__)

# MUNDIAL is a legacy category not exposed in the frontend today — excluded
# from the toggle so the admin UI only ever shows categories users can see.
TOGGLEABLE_CATEGORIES = [
    c for c in MarketCategory if c != MarketCategory.MUNDIAL
]


def get_hidden_categories(db: Session) -> set[str]:
    """Categories currently hidden. Fails open (empty set) on lookup error,
    same as the rest of the project's infra-outage handling — an unreachable
    DB row should never hide content that was never explicitly toggled off."""
    try:
        rows = (
            db.query(CategoryVisibility.category)
            .filter(CategoryVisibility.is_visible.is_(False))
            .all()
        )
        return {row.category for row in rows}
    except Exception as exc:
        logger.warning("category_visibility lookup failed, failing open: %s", exc)
        return set()


def get_all_visibility(db: Session) -> list[dict]:
    """Every toggleable category with its current state — visible by default
    when no row exists yet."""
    rows = {row.category: row for row in db.query(CategoryVisibility).all()}
    return [
        {
            "category": category.value,
            "is_visible": rows[category.value].is_visible if category.value in rows else True,
            "updated_at": rows[category.value].updated_at if category.value in rows else None,
        }
        for category in TOGGLEABLE_CATEGORIES
    ]


def set_visibility(
    db: Session, category: str, is_visible: bool, admin_user_id: uuid.UUID
) -> CategoryVisibility:
    row = db.query(CategoryVisibility).filter(CategoryVisibility.category == category).first()
    if row is None:
        row = CategoryVisibility(category=category)
        db.add(row)
    row.is_visible = is_visible
    row.updated_by = admin_user_id
    db.commit()
    db.refresh(row)
    return row
