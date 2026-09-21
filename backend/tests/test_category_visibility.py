from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.category_visibility import CategoryVisibility
from app.models.market import MarketCategory
from app.models.prediction import Prediction
from app.models.user import User
from app.services import market_service


def _hide_category(db: Session, category: str) -> None:
    db.add(CategoryVisibility(category=category, is_visible=False))
    db.commit()


def test_get_markets_hides_category_when_toggled_off(db: Session, sample_markets):
    _hide_category(db, MarketCategory.CRYPTO.value)

    markets, total = market_service.get_markets(db)

    categories = {m.category for m in markets}
    assert MarketCategory.CRYPTO not in categories
    assert total == len(sample_markets) - 1


def test_get_markets_admin_sees_hidden_category(db: Session, sample_markets):
    _hide_category(db, MarketCategory.CRYPTO.value)

    markets, total = market_service.get_markets(db, include_hidden_categories=True)

    categories = {m.category for m in markets}
    assert MarketCategory.CRYPTO in categories
    assert total == len(sample_markets)


def test_get_markets_default_visible_when_no_rows(db: Session, sample_markets):
    markets, total = market_service.get_markets(db)

    assert total == len(sample_markets)


def test_public_markets_endpoint_excludes_hidden_category(
    client: TestClient, db: Session, sample_markets
):
    _hide_category(db, MarketCategory.CRYPTO.value)

    response = client.get("/api/markets", params={"limit": 100})

    assert response.status_code == 200
    categories = {m["category"] for m in response.json()}
    assert "crypto" not in categories


def test_user_own_prediction_still_visible_when_category_hidden(
    client: TestClient, db: Session, user_headers, sample_market
):
    """sample_market is CRYPTO — hiding it must not hide the user's own history."""
    user = db.query(User).filter(User.email == "test@predictax.com").first()
    prediction = Prediction(
        user_id=user.id,
        market_id=sample_market.id,
        probability=60,
        points_wagered=50,
        potential_gain=20,
    )
    db.add(prediction)
    db.commit()

    _hide_category(db, MarketCategory.CRYPTO.value)

    response = client.get("/api/predictions", headers=user_headers)

    assert response.status_code == 200
    assert [item["market_id"] for item in response.json()] == [str(sample_market.id)]


def test_market_detail_endpoint_accessible_when_category_hidden(
    client: TestClient, db: Session, sample_market
):
    _hide_category(db, MarketCategory.CRYPTO.value)

    response = client.get(f"/api/markets/{sample_market.id}")

    assert response.status_code == 200


def test_public_categories_visibility_endpoint_no_auth_required(client: TestClient):
    response = client.get("/api/markets/categories/visibility")

    assert response.status_code == 200
    categories = {row["category"] for row in response.json()}
    assert categories == {"economia", "politica", "deportes", "tecnologia", "crypto"}
    assert all(row["is_visible"] is True for row in response.json())


def test_admin_get_categories_visibility_requires_admin(client: TestClient, user_headers):
    response = client.get("/api/admin/categories/visibility", headers=user_headers)

    assert response.status_code == 403


def test_admin_get_categories_visibility_default_all_true(client: TestClient, admin_headers):
    response = client.get("/api/admin/categories/visibility", headers=admin_headers)

    assert response.status_code == 200
    assert all(row["is_visible"] is True for row in response.json())


def test_admin_patch_categories_visibility_toggles_and_persists(
    client: TestClient, db: Session, admin_headers
):
    response = client.patch(
        "/api/admin/categories/visibility",
        headers=admin_headers,
        json={"category": "crypto", "is_visible": False},
    )

    assert response.status_code == 200
    body = {row["category"]: row["is_visible"] for row in response.json()}
    assert body["crypto"] is False

    row = db.query(CategoryVisibility).filter(CategoryVisibility.category == "crypto").first()
    assert row is not None
    assert row.is_visible is False
    assert row.updated_by is not None


def test_admin_patch_categories_visibility_rejects_invalid_category(
    client: TestClient, admin_headers
):
    response = client.patch(
        "/api/admin/categories/visibility",
        headers=admin_headers,
        json={"category": "not-a-category", "is_visible": False},
    )

    assert response.status_code == 422


def test_admin_patch_categories_visibility_requires_admin(client: TestClient, user_headers):
    response = client.patch(
        "/api/admin/categories/visibility",
        headers=user_headers,
        json={"category": "crypto", "is_visible": False},
    )

    assert response.status_code == 403
