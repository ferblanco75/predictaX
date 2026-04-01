"""
Seed script to populate the database with initial data for development.

Usage:
    cd backend
    python scripts/seed_data.py
"""
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.prediction import Prediction
from app.models.market_snapshot import MarketSnapshot


def seed_users(db: Session) -> list[User]:
    users = [
        User(
            email="admin@predictax.com",
            username="admin",
            hashed_password=get_password_hash("admin1234"),
            points=5000.0,
        ),
        User(
            email="demo@predictax.com",
            username="demo_user",
            hashed_password=get_password_hash("demo1234"),
            points=1000.0,
        ),
        User(
            email="alice@predictax.com",
            username="alice",
            hashed_password=get_password_hash("alice1234"),
            points=2500.0,
        ),
        User(
            email="bob@predictax.com",
            username="bob",
            hashed_password=get_password_hash("bob12345"),
            points=750.0,
        ),
    ]
    db.add_all(users)
    db.flush()
    print(f"  Created {len(users)} users")
    return users


def seed_markets(db: Session) -> list[Market]:
    now = datetime.now(timezone.utc)
    markets = [
        Market(
            title="¿El dólar blue superará los $2000 antes de fin de año?",
            description="El mercado predice si el tipo de cambio informal (dólar blue) en Argentina superará los $2000 pesos antes del 31 de diciembre de 2026.",
            category=MarketCategory.ECONOMIA,
            type=MarketType.BINARY,
            probability_market=62.0,
            volume=4500.0,
            participants_count=38,
            end_date=now + timedelta(days=180),
            status=MarketStatus.ACTIVE,
        ),
        Market(
            title="¿Milei ganará la reelección en 2027?",
            description="Probabilidad de que el presidente Javier Milei sea reelecto en las elecciones presidenciales de Argentina de 2027.",
            category=MarketCategory.POLITICA,
            type=MarketType.BINARY,
            probability_market=45.0,
            volume=12000.0,
            participants_count=95,
            end_date=now + timedelta(days=500),
            status=MarketStatus.ACTIVE,
        ),
        Market(
            title="¿Argentina clasificará al Mundial 2026?",
            description="¿La selección argentina de fútbol clasificará directamente al Mundial 2026 sin necesidad de repechaje?",
            category=MarketCategory.DEPORTES,
            type=MarketType.BINARY,
            probability_market=88.0,
            volume=8200.0,
            participants_count=120,
            end_date=now + timedelta(days=90),
            status=MarketStatus.ACTIVE,
        ),
        Market(
            title="¿Bitcoin superará los $150,000 USD en 2026?",
            description="Probabilidad de que el precio de Bitcoin supere los $150,000 dólares en algún momento durante el año 2026.",
            category=MarketCategory.CRYPTO,
            type=MarketType.BINARY,
            probability_market=55.0,
            volume=6800.0,
            participants_count=74,
            end_date=now + timedelta(days=270),
            status=MarketStatus.ACTIVE,
        ),
        Market(
            title="¿Apple lanzará un modelo de AR glasses en 2026?",
            description="¿Apple anunciará y pondrá a la venta unas gafas de realidad aumentada (distintas a Vision Pro) antes de fin de 2026?",
            category=MarketCategory.TECNOLOGIA,
            type=MarketType.BINARY,
            probability_market=30.0,
            volume=3100.0,
            participants_count=55,
            end_date=now + timedelta(days=300),
            status=MarketStatus.ACTIVE,
        ),
        Market(
            title="¿La inflación de Argentina bajará del 50% anual en 2026?",
            description="¿La inflación interanual de Argentina se ubicará por debajo del 50% en diciembre de 2026?",
            category=MarketCategory.ECONOMIA,
            type=MarketType.BINARY,
            probability_market=70.0,
            volume=9500.0,
            participants_count=88,
            end_date=now + timedelta(days=365),
            status=MarketStatus.ACTIVE,
        ),
    ]
    db.add_all(markets)
    db.flush()
    print(f"  Created {len(markets)} markets")
    return markets


def seed_predictions(db: Session, users: list[User], markets: list[Market]):
    predictions = [
        Prediction(user_id=users[1].id, market_id=markets[0].id, probability=70.0, points_wagered=100.0),
        Prediction(user_id=users[2].id, market_id=markets[0].id, probability=55.0, points_wagered=200.0),
        Prediction(user_id=users[1].id, market_id=markets[1].id, probability=40.0, points_wagered=150.0),
        Prediction(user_id=users[3].id, market_id=markets[1].id, probability=50.0, points_wagered=250.0),
        Prediction(user_id=users[2].id, market_id=markets[2].id, probability=90.0, points_wagered=300.0),
        Prediction(user_id=users[1].id, market_id=markets[3].id, probability=60.0, points_wagered=100.0),
        Prediction(user_id=users[3].id, market_id=markets[4].id, probability=25.0, points_wagered=50.0),
        Prediction(user_id=users[2].id, market_id=markets[5].id, probability=75.0, points_wagered=400.0),
    ]
    db.add_all(predictions)
    db.flush()
    print(f"  Created {len(predictions)} predictions")


def seed_snapshots(db: Session, markets: list[Market]):
    now = datetime.now(timezone.utc)
    snapshots = []
    # Generate 7 days of daily snapshots per market
    for market in markets:
        base_prob = market.probability_market
        for days_ago in range(7, 0, -1):
            drift = (7 - days_ago) * (0.5 if days_ago % 2 == 0 else -0.3)
            prob = max(1.0, min(99.0, base_prob - 3 + drift))
            snapshots.append(
                MarketSnapshot(
                    market_id=market.id,
                    probability=round(prob, 1),
                    timestamp=now - timedelta(days=days_ago),
                )
            )
    db.add_all(snapshots)
    db.flush()
    print(f"  Created {len(snapshots)} market snapshots")


def run():
    print("Seeding database...")
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already has data. Skipping seed.")
            print("To reseed, truncate the tables first.")
            return

        users = seed_users(db)
        markets = seed_markets(db)
        seed_predictions(db, users, markets)
        seed_snapshots(db, markets)

        db.commit()
        print("Seed completed successfully.")
        print("\nTest credentials:")
        print("  admin@predictax.com / admin1234")
        print("  demo@predictax.com  / demo1234")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
