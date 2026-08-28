"""
Recalcula probability_market de todos los mercados activos usando el nuevo
algoritmo: ratio de puntos SÍ (probability > 50) sobre el total de puntos.

Ejecutar una sola vez después del deploy de BUG032:
  docker compose exec backend python scripts/recalculate_market_probabilities.py

Muestra old → new por mercado para revisión antes de confirmar.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.market import Market, MarketStatus
from app.models.prediction import Prediction
from app.services.prediction_service import calculate_market_probability


def run() -> None:
    db = SessionLocal()
    try:
        active_markets = (
            db.query(Market).filter(Market.status == MarketStatus.ACTIVE).all()
        )

        print(f"Mercados activos encontrados: {len(active_markets)}\n")

        updated = 0
        skipped = 0

        for market in active_markets:
            predictions = (
                db.query(Prediction)
                .filter(Prediction.market_id == market.id)
                .all()
            )

            if not predictions:
                skipped += 1
                continue

            new_prob = calculate_market_probability(predictions)
            old_prob = float(market.probability_market)

            market.probability_market = new_prob
            diff = new_prob - old_prob
            sign = "+" if diff >= 0 else ""
            print(f"  {old_prob:.1f}% → {new_prob:.1f}% ({sign}{diff:.1f}%)  {market.title[:70]}")
            updated += 1

        db.commit()
        print(f"\nActualizados: {updated} | Sin predicciones (sin cambio): {skipped}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
