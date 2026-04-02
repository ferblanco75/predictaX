"""
Seed script to populate the database with initial data for development.
Migrates the 28 mock markets from frontend/src/lib/data/markets.ts

Usage:
    cd backend
    python scripts/seed_data.py
"""
import sys
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.prediction import Prediction
from app.models.market_snapshot import MarketSnapshot


def parse_date(date_str: str) -> datetime:
    return datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)


def seed_users(db: Session) -> list[User]:
    users = [
        User(
            email="admin@predictax.com",
            username="admin",
            hashed_password=get_password_hash("admin1234"),
            points=5000.0,
            is_active=True,
        ),
        User(
            email="demo@predictax.com",
            username="demo_user",
            hashed_password=get_password_hash("demo1234"),
            points=1000.0,
            is_active=True,
        ),
        User(
            email="alice@predictax.com",
            username="alice",
            hashed_password=get_password_hash("alice1234"),
            points=2500.0,
            is_active=True,
        ),
        User(
            email="bob@predictax.com",
            username="bob",
            hashed_password=get_password_hash("bob12345"),
            points=750.0,
            is_active=True,
        ),
    ]
    db.add_all(users)
    db.flush()
    print(f"  Created {len(users)} users")
    return users


def seed_markets(db: Session) -> list[Market]:
    # All 28 binary markets from frontend/src/lib/data/markets.ts
    mock_markets = [
        # ECONOMÍA (8)
        {
            "title": "¿El dólar blue superará $1,500 antes de julio 2026?",
            "description": 'El mercado del dólar paralelo o "blue" en Argentina ha sido históricamente volátil. Con las recientes medidas económicas del gobierno y las expectativas de inflación, los analistas debaten si la brecha cambiaria se ampliará nuevamente.\n\nEste mercado se resolverá como SÍ si en cualquier momento antes del 1 de julio de 2026, el precio de venta del dólar blue alcanza o supera los $1,500 ARS según la cotización promedio reportada por al menos 3 fuentes confiables (ámbito.com, dolarblue.net, infodolar.com).',
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 68.00,
            "volume": 15100.0,
            "participants_count": 234,
            "end_date": parse_date("2026-07-01"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Inflación de Argentina en marzo 2026 será mayor al 10%",
            "description": "La inflación mensual en Argentina ha mostrado señales de desaceleración tras el shock inicial de la gestión Milei. Sin embargo, presiones estacionales y ajustes de tarifas podrían generar un rebote inflacionario en el primer trimestre de 2026.\n\nEste mercado se resolverá según el dato oficial del INDEC para la inflación mensual de marzo 2026. Se considerará SÍ si el índice es 10.0% o superior.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 34.00,
            "volume": 8700.0,
            "participants_count": 187,
            "end_date": parse_date("2026-04-10"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Reservas del BCRA superarán U$S 35.000M en junio 2026",
            "description": "Las reservas internacionales del Banco Central son un indicador crucial de la salud económica argentina. Después de años de caída, la actual gestión apunta a reconstruirlas mediante superávit comercial y acuerdos internacionales.\n\nResolución: Este mercado se resolverá como SÍ si al 30 de junio de 2026, las reservas internacionales brutas del BCRA son iguales o superiores a U$S 35.000 millones según el balance oficial publicado.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 52.00,
            "volume": 12300.0,
            "participants_count": 156,
            "end_date": parse_date("2026-06-30"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Argentina cumplirá metas fiscales del FMI en Q1 2026",
            "description": "El acuerdo con el Fondo Monetario Internacional establece metas trimestrales de déficit fiscal primario. El cumplimiento de estas metas es crucial para mantener el flujo de desembolsos y la credibilidad externa.\n\nEste mercado se resolverá como SÍ si Argentina cumple con todas las metas fiscales establecidas en el acuerdo con el FMI para el primer trimestre de 2026, según el informe oficial del organismo.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 71.00,
            "volume": 9400.0,
            "participants_count": 143,
            "end_date": parse_date("2026-05-15"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Riesgo país de Argentina caerá por debajo de 700 puntos",
            "description": "El riesgo país es un indicador clave de la confianza internacional en Argentina. Tras el pico de 2020, ha mostrado mejoras pero se mantiene en niveles históricamente altos.\n\nResolución: Se considera SÍ si el índice EMBI+ Argentina (Riesgo País) cierra por debajo de 700 puntos básicos en cualquier día antes del 31 de agosto de 2026, según datos de JP Morgan.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 46.00,
            "volume": 7800.0,
            "participants_count": 129,
            "end_date": parse_date("2026-08-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Precio del petróleo Brent superará U$S 100 en 2026",
            "description": "El precio internacional del petróleo impacta directamente en la economía argentina, tanto por el costo de importación de combustibles como por las exportaciones de Vaca Muerta.\n\nEste mercado se resolverá como SÍ si el precio del barril de petróleo Brent supera los U$S 100 en cualquier cierre diario durante 2026, según datos de ICE Futures Europe.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 29.00,
            "volume": 11200.0,
            "participants_count": 198,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Exportaciones argentinas de energía superarán U$S 15B en 2026",
            "description": "El desarrollo de Vaca Muerta y la infraestructura de exportación posicionan a Argentina como potencial exportador energético regional.\n\nResolución: SÍ si las exportaciones totales de energía (gas, petróleo, derivados) de Argentina en 2026 suman U$S 15.000 millones o más según datos del INDEC.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 58.00,
            "volume": 6900.0,
            "participants_count": 112,
            "end_date": parse_date("2027-02-28"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Salario real en Argentina crecerá más de 5% interanual en 2026",
            "description": "Tras años de pérdida de poder adquisitivo, existe debate sobre si 2026 marcará una recuperación significativa del salario real.\n\nEste mercado se resolverá como SÍ si el índice de salarios reales del INDEC muestra un incremento interanual mayor al 5% en el promedio de 2026 vs 2025.",
            "category": MarketCategory.ECONOMIA,
            "type": MarketType.BINARY,
            "probability_market": 41.00,
            "volume": 5600.0,
            "participants_count": 94,
            "end_date": parse_date("2027-03-15"),
            "status": MarketStatus.ACTIVE,
        },
        # POLÍTICA LATAM (8)
        {
            "title": "Milei mantendrá aprobación superior al 50% hasta junio 2026",
            "description": "La aprobación presidencial es un indicador clave de capital político. Javier Milei inició su gestión con alta popularidad, pero enfrenta desafíos de implementación de reformas.\n\nResolución: SÍ si el promedio de encuestas de imagen positiva de Milei se mantiene en 50% o más en cada mes desde marzo hasta junio 2026 (promedio de al menos 3 consultoras reconocidas).",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 48.00,
            "volume": 13500.0,
            "participants_count": 267,
            "end_date": parse_date("2026-07-05"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "La Ley de Bases será aprobada en el Congreso antes de mayo 2026",
            "description": 'La llamada "Ley Ómnibus" o Ley de Bases es la principal reforma legislativa del gobierno de Milei. Su aprobación depende de negociaciones con bloques provinciales y moderados.\n\nEste mercado se resolverá como SÍ si la Ley de Bases (o una versión con más del 60% del articulado original) es aprobada por ambas cámaras antes del 1 de mayo de 2026.',
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 62.00,
            "volume": 10800.0,
            "participants_count": 189,
            "end_date": parse_date("2026-05-01"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Elecciones México 2024: Claudia Sheinbaum ganará presidencia",
            "description": "México celebró elecciones presidenciales en 2024. Claudia Sheinbaum, candidata oficialista de Morena, lideró las encuestas y ganó la presidencia.\n\nNota: Este mercado ya se resolvió históricamente - ejemplo de mercado cerrado.",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 95.00,
            "volume": 28400.0,
            "participants_count": 512,
            "end_date": parse_date("2024-06-03"),
            "status": MarketStatus.RESOLVED,
            "resolved_at": parse_date("2024-06-03"),
            "resolution_value": True,
        },
        {
            "title": "Brasil aprobará reforma tributaria completa antes de julio 2026",
            "description": "Brasil está en proceso de aprobar una reforma tributaria histórica que simplificaría el complejo sistema de impuestos indirectos.\n\nEste mercado se resolverá como SÍ si la reforma tributaria brasileña (unificación de IVA) es completamente aprobada por el Congreso y estados antes del 1 de julio de 2026.",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 54.00,
            "volume": 9100.0,
            "participants_count": 147,
            "end_date": parse_date("2026-07-01"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Chile: Aprobación de Boric caerá bajo 25% antes de agosto 2026",
            "description": "El presidente chileno Gabriel Boric enfrenta desafíos de seguridad pública, economía y fracaso del proceso constituyente.\n\nResolución: SÍ si el promedio de encuestas de aprobación de Boric cae por debajo del 25% en cualquier mes antes de agosto 2026 (promedio de Cadem, Criteria y Activa).",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 67.00,
            "volume": 7300.0,
            "participants_count": 134,
            "end_date": parse_date("2026-08-01"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Perú tendrá elecciones anticipadas antes de diciembre 2026",
            "description": "Perú enfrenta inestabilidad política crónica con múltiples presidentes en pocos años.\n\nEste mercado se resolverá como SÍ si se convocan y realizan elecciones presidenciales en Perú antes del 31 de diciembre de 2026.",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 38.00,
            "volume": 6800.0,
            "participants_count": 118,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Venezuela: Maduro seguirá en el poder hasta diciembre 2026",
            "description": "La situación política en Venezuela es altamente polarizada. A pesar de presión internacional y oposición interna, el chavismo ha mantenido el control del ejecutivo.\n\nResolución: SÍ si Nicolás Maduro permanece como presidente de Venezuela (reconocido o de facto) hasta el 31 de diciembre de 2026.",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 78.00,
            "volume": 11700.0,
            "participants_count": 203,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Colombia aprobará reforma pensional antes de junio 2026",
            "description": "El gobierno de Petro propone una reforma estructural al sistema pensional colombiano, buscando mayor equidad pero enfrentando oposición del sector privado.\n\nEste mercado se resolverá como SÍ si la reforma pensional propuesta por el gobierno Petro es aprobada por el Congreso de Colombia antes del 1 de junio de 2026.",
            "category": MarketCategory.POLITICA,
            "type": MarketType.BINARY,
            "probability_market": 44.00,
            "volume": 5900.0,
            "participants_count": 101,
            "end_date": parse_date("2026-06-01"),
            "status": MarketStatus.ACTIVE,
        },
        # DEPORTES (5)
        {
            "title": "Boca Juniors ganará el torneo argentino apertura 2026",
            "description": "El fútbol argentino mantiene su pasión y competitividad. Boca Juniors, uno de los clubes más grandes, busca volver a la gloria tras años irregulares.\n\nResolución: SÍ si Boca Juniors es campeón del Torneo Apertura 2026 de la Liga Profesional de Fútbol Argentino.",
            "category": MarketCategory.DEPORTES,
            "type": MarketType.BINARY,
            "probability_market": 22.00,
            "volume": 14600.0,
            "participants_count": 289,
            "end_date": parse_date("2026-06-30"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "River Plate clasificará a cuartos de Libertadores 2026",
            "description": "La Copa Libertadores es el torneo más prestigioso de Sudamérica. River Plate históricamente ha sido protagonista y busca extender su racha de clasificaciones.\n\nEste mercado se resolverá como SÍ si River Plate clasifica a la fase de cuartos de final de la Copa Libertadores 2026.",
            "category": MarketCategory.DEPORTES,
            "type": MarketType.BINARY,
            "probability_market": 64.00,
            "volume": 18200.0,
            "participants_count": 341,
            "end_date": parse_date("2026-08-15"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Selección Argentina ganará Copa América 2024",
            "description": "Argentina es la actual campeona del mundo y favorita para la Copa América 2024 que se disputa en Estados Unidos.\n\nNota: Mercado histórico resuelto - ejemplo de evento pasado con alta probabilidad final.",
            "category": MarketCategory.DEPORTES,
            "type": MarketType.BINARY,
            "probability_market": 92.00,
            "volume": 45700.0,
            "participants_count": 687,
            "end_date": parse_date("2024-07-15"),
            "status": MarketStatus.RESOLVED,
            "resolved_at": parse_date("2024-07-15"),
            "resolution_value": True,
        },
        {
            "title": "Argentina clasificará al Mundial 2026 en top 3 de Sudamérica",
            "description": "Las Eliminatorias Sudamericanas para el Mundial 2026 están en curso. Argentina, como campeona del mundo, busca clasificar con comodidad.\n\nResolución: SÍ si Argentina termina en las primeras 3 posiciones de la tabla de Eliminatorias CONMEBOL para el Mundial 2026.",
            "category": MarketCategory.DEPORTES,
            "type": MarketType.BINARY,
            "probability_market": 85.00,
            "volume": 22400.0,
            "participants_count": 398,
            "end_date": parse_date("2025-11-20"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Brasileño ganará el Balón de Oro 2026",
            "description": "Brasil, históricamente potencia futbolística, no tiene un ganador del Balón de Oro desde Kaká en 2007. Vinicius Jr y otros talentos buscan romper la sequía.\n\nEste mercado se resolverá como SÍ si un jugador de nacionalidad brasileña gana el Balón de Oro 2026 (entregado en octubre/noviembre 2026).",
            "category": MarketCategory.DEPORTES,
            "type": MarketType.BINARY,
            "probability_market": 31.00,
            "volume": 16800.0,
            "participants_count": 245,
            "end_date": parse_date("2026-11-30"),
            "status": MarketStatus.ACTIVE,
        },
        # TECNOLOGÍA (4)
        {
            "title": "Mercado Libre superará capitalización de U$S 100B en 2026",
            "description": "Mercado Libre es el gigante tech de América Latina. Su capitalización bursátil ha crecido exponencialmente, compitiendo con grandes del e-commerce global.\n\nResolución: SÍ si la capitalización de mercado de Mercado Libre (MELI) alcanza o supera los U$S 100 mil millones en cualquier cierre de mercado durante 2026.",
            "category": MarketCategory.TECNOLOGIA,
            "type": MarketType.BINARY,
            "probability_market": 56.00,
            "volume": 19300.0,
            "participants_count": 276,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Habrá IPO de unicornio tech latinoamericano en 2026",
            "description": "América Latina tiene varios unicornios tech (startups valuadas en +$1B). El mercado espera que alguno salga a bolsa en 2026, siguiendo los pasos de Mercado Libre y otros.\n\nEste mercado se resolverá como SÍ si al menos un unicornio tech latinoamericano realiza su IPO en cualquier bolsa durante 2026.",
            "category": MarketCategory.TECNOLOGIA,
            "type": MarketType.BINARY,
            "probability_market": 38.00,
            "volume": 8700.0,
            "participants_count": 162,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Argentina lanzará satélite propio al espacio antes de 2027",
            "description": "Argentina tiene tradición en tecnología espacial con CONAE y la empresa satelital INVAP. Existen proyectos de nuevos satélites de observación y comunicaciones.\n\nResolución: SÍ si Argentina (CONAE, INVAP u organismo estatal) lanza exitosamente al espacio un satélite de diseño y fabricación nacional antes del 1 de enero de 2027.",
            "category": MarketCategory.TECNOLOGIA,
            "type": MarketType.BINARY,
            "probability_market": 42.00,
            "volume": 5400.0,
            "participants_count": 98,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Adopción de IA generativa en empresas LATAM superará 40%",
            "description": "La inteligencia artificial generativa (ChatGPT, Claude, etc.) está transformando el trabajo. Este mercado evalúa la velocidad de adopción corporativa en América Latina.\n\nResolución: SÍ si según encuestas de consultoras reconocidas (McKinsey, Gartner, IDC), más del 40% de empresas medianas y grandes de LATAM reportan uso regular de IA generativa para Q4 2026.",
            "category": MarketCategory.TECNOLOGIA,
            "type": MarketType.BINARY,
            "probability_market": 61.00,
            "volume": 12800.0,
            "participants_count": 217,
            "end_date": parse_date("2027-01-31"),
            "status": MarketStatus.ACTIVE,
        },
        # CRYPTO (3)
        {
            "title": "Bitcoin superará U$S 100,000 antes de julio 2026",
            "description": "Bitcoin ha mostrado ciclos alcistas cada 4 años coincidiendo con halvings. El halving 2024 generó expectativas de nuevo rally hacia máximos históricos.\n\nResolución: SÍ si el precio de Bitcoin (BTC/USD) alcanza o supera los U$S 100,000 en cualquier exchange mayor (promedio de Coinbase, Binance, Kraken) antes del 1 de julio de 2026.",
            "category": MarketCategory.CRYPTO,
            "type": MarketType.BINARY,
            "probability_market": 47.00,
            "volume": 31500.0,
            "participants_count": 489,
            "end_date": parse_date("2026-07-01"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Argentina regulará oficialmente el uso de criptomonedas en 2026",
            "description": "Argentina tiene alta adopción cripto debido a inestabilidad económica, pero carece de marco regulatorio claro.\n\nEste mercado se resolverá como SÍ si Argentina aprueba y promulga una ley específica de regulación de criptoactivos antes del 31 de diciembre de 2026.",
            "category": MarketCategory.CRYPTO,
            "type": MarketType.BINARY,
            "probability_market": 53.00,
            "volume": 9600.0,
            "participants_count": 178,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
        {
            "title": "Ethereum completará transición completa a proof-of-stake 2.0",
            "description": 'Ethereum completó "The Merge" en 2022, pero el roadmap incluye mejoras adicionales (sharding, danksharding) para escalabilidad y eficiencia.\n\nResolución: SÍ si Ethereum implementa exitosamente la siguiente fase mayor de upgrades (proto-danksharding o danksharding completo) antes de diciembre 2026.',
            "category": MarketCategory.CRYPTO,
            "type": MarketType.BINARY,
            "probability_market": 34.00,
            "volume": 14200.0,
            "participants_count": 234,
            "end_date": parse_date("2026-12-31"),
            "status": MarketStatus.ACTIVE,
        },
    ]

    markets = []
    for data in mock_markets:
        market = Market(
            title=data["title"],
            description=data["description"],
            category=data["category"],
            type=data["type"],
            probability_market=data["probability_market"],
            volume=data["volume"],
            participants_count=data["participants_count"],
            end_date=data["end_date"],
            status=data["status"],
            resolved_at=data.get("resolved_at"),
            resolution_value=data.get("resolution_value"),
        )
        markets.append(market)

    db.add_all(markets)
    db.flush()
    print(f"  Created {len(markets)} markets")
    return markets


def seed_predictions(db: Session, users: list[User], markets: list[Market]):
    predictions = [
        Prediction(user_id=users[1].id, market_id=markets[0].id, probability=70.0, points_wagered=100.0, potential_gain=185.0),
        Prediction(user_id=users[2].id, market_id=markets[0].id, probability=55.0, points_wagered=200.0, potential_gain=320.0),
        Prediction(user_id=users[1].id, market_id=markets[1].id, probability=40.0, points_wagered=150.0, potential_gain=270.0),
        Prediction(user_id=users[3].id, market_id=markets[1].id, probability=50.0, points_wagered=250.0, potential_gain=430.0),
        Prediction(user_id=users[2].id, market_id=markets[2].id, probability=90.0, points_wagered=300.0, potential_gain=510.0),
        Prediction(user_id=users[1].id, market_id=markets[3].id, probability=60.0, points_wagered=100.0, potential_gain=160.0),
        Prediction(user_id=users[3].id, market_id=markets[4].id, probability=25.0, points_wagered=50.0, potential_gain=140.0),
        Prediction(user_id=users[2].id, market_id=markets[5].id, probability=75.0, points_wagered=400.0, potential_gain=620.0),
    ]
    db.add_all(predictions)
    db.flush()
    print(f"  Created {len(predictions)} predictions")


def seed_snapshots(db: Session, markets: list[Market]):
    from datetime import timedelta

    snapshots = []
    for market in markets:
        if market.status == MarketStatus.RESOLVED:
            continue
        base_prob = float(market.probability_market)
        now = datetime.now(timezone.utc)
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
        if db.query(User).count() > 0:
            print("Database already has data. Skipping seed.")
            print("To reseed, truncate the tables first.")
            return

        users = seed_users(db)
        markets = seed_markets(db)
        seed_predictions(db, users, markets)
        seed_snapshots(db, markets)

        db.commit()
        print("\nSeed completed successfully.")
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
