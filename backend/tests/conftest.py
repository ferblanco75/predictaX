import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.database import Base, get_db

# Use a separate test database — falls back to SQLite for CI without PostgreSQL
import os

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://predictax:predictax_dev@localhost:5433/predictax_test",
)

# For SQLite in CI
if TEST_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Test user data
USER_DATA = {
    "email": "test@predictax.com",
    "username": "testuser",
    "password": "securepass123",
}

ADMIN_DATA = {
    "email": "admin-test@predictax.com",
    "username": "admintest",
    "password": "adminpass123",
}


@pytest.fixture(scope="session", autouse=True)
def create_test_db():
    """Create all tables in the test database before the session, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Provide a transactional DB session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """Provide a TestClient with the DB override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    """Register a test user and return user data."""
    response = client.post("/api/auth/register", json=USER_DATA)
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def user_token(client, registered_user):
    """Get a JWT token for a regular user."""
    response = client.post(
        "/api/auth/login",
        json={"email": USER_DATA["email"], "password": USER_DATA["password"]},
    )
    return response.json()["access_token"]


@pytest.fixture()
def user_headers(user_token):
    """Auth headers for a regular user."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture()
def admin_user(client, db):
    """Register an admin user and set role to admin."""
    response = client.post("/api/auth/register", json=ADMIN_DATA)
    assert response.status_code == 201
    user_data = response.json()

    # Set role to admin directly in DB
    from app.models.user import User
    user = db.query(User).filter(User.email == ADMIN_DATA["email"]).first()
    user.role = "admin"
    db.commit()
    db.refresh(user)

    return user_data


@pytest.fixture()
def admin_token(client, admin_user):
    """Get a JWT token for an admin user."""
    response = client.post(
        "/api/auth/login",
        json={"email": ADMIN_DATA["email"], "password": ADMIN_DATA["password"]},
    )
    return response.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token):
    """Auth headers for an admin user."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def sample_market(db):
    """Create a sample market in the DB."""
    from app.models.market import Market, MarketCategory, MarketStatus, MarketType
    from datetime import datetime, timezone, timedelta

    market = Market(
        title="Test Market: Will BTC hit 100k?",
        description="Test market description for unit tests.",
        category=MarketCategory.CRYPTO,
        type=MarketType.BINARY,
        probability_market=55.0,
        volume=10000,
        participants_count=50,
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=MarketStatus.ACTIVE,
    )
    db.add(market)
    db.commit()
    db.refresh(market)
    return market


@pytest.fixture()
def sample_markets(db):
    """Create multiple sample markets."""
    from app.models.market import Market, MarketCategory, MarketStatus, MarketType
    from datetime import datetime, timezone, timedelta

    markets = []
    data = [
        ("Dolar blue > 1500?", MarketCategory.ECONOMIA, 68.0, 15000, 200),
        ("Milei aprobacion > 50%?", MarketCategory.POLITICA, 48.0, 8000, 150),
        ("Boca campeon?", MarketCategory.DEPORTES, 22.0, 5000, 100),
        ("MercadoLibre > 100B?", MarketCategory.TECNOLOGIA, 56.0, 12000, 180),
        ("BTC > 100k?", MarketCategory.CRYPTO, 47.0, 9000, 120),
    ]
    for title, cat, prob, vol, parts in data:
        m = Market(
            title=title,
            description=f"Description for {title}",
            category=cat,
            type=MarketType.BINARY,
            probability_market=prob,
            volume=vol,
            participants_count=parts,
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
            status=MarketStatus.ACTIVE,
        )
        db.add(m)
        markets.append(m)
    db.commit()
    for m in markets:
        db.refresh(m)
    return markets
