"""
Seed script — Mundial 2026 polls (12-15 mercados de predicción)

El Mundial FIFA 2026 se juega en USA, México y Canadá.
Fase de grupos: 12 junio - 2 julio 2026
Octavos: 4-8 julio 2026
Cuartos: 11-12 julio 2026
Semifinales: 15-16 julio 2026
Final: 19 julio 2026

Usage:
    docker compose exec backend python scripts/seed_mundial_2026.py
"""
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.market import Market, MarketCategory, MarketStatus, MarketType
from app.models.market_snapshot import MarketSnapshot


def dt(date_str: str) -> datetime:
    return datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)


MUNDIAL_POLLS = [
    # ── GANADOR DEL TORNEO ──────────────────────────────────────────────────────
    {
        "title": "¿Ganará Argentina el Mundial 2026?",
        "description": (
            "Argentina llega al Mundial 2026 como campeona defensora tras su consagración en Qatar 2022. "
            "El equipo de Lionel Scaloni mantiene la columna vertebral del plantel campeón y suma figuras jóvenes como Lautaro Martínez, Julian Álvarez y Enzo Fernández.\n\n"
            "Lionel Messi, a sus 38 años, confirmó que disputará el torneo buscando el único título que le falta: un segundo Mundial. "
            "Argentina integra el Grupo A junto a España, Marruecos y Arabia Saudita.\n\n"
            "Este mercado se resolverá como SÍ si Argentina es campeona del Mundial FIFA 2026."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 28.00,
        "volume": 42000.0,
        "participants_count": 1820,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Ganará Brasil el Mundial 2026?",
        "description": (
            "Brasil no gana un Mundial desde 2002 y llega al torneo como uno de los favoritos con una nueva generación liderada por Vinicius Jr., Rodrygo y Endrick. "
            "La selección canarinha tuvo una clasificación complicada en las Eliminatorias Sudamericanas pero llega en forma al torneo.\n\n"
            "El técnico Carlo Ancelotti (confirmado tras el Mundial) apuesta por un sistema ofensivo con doble 9. "
            "Brasil integra el Grupo C junto a Alemania, Colombia y Japón.\n\n"
            "Este mercado se resolverá como SÍ si Brasil es campeón del Mundial FIFA 2026."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 22.00,
        "volume": 38500.0,
        "participants_count": 1540,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Ganará Francia el Mundial 2026?",
        "description": (
            "Francia llega al Mundial 2026 con uno de los planteles más talentosos del mundo. "
            "Mbappé, ahora en el Real Madrid, lidera un equipo que fue campeón en 2018 y finalista en 2022. "
            "Los Bleus también cuentan con Griezmann, Camavinga, Tchouaméni y una defensa sólida.\n\n"
            "El técnico Didier Deschamps busca su segundo título mundial como entrenador. "
            "Francia integra el Grupo B junto a Portugal, México y Senegal.\n\n"
            "Este mercado se resolverá como SÍ si Francia es campeón del Mundial FIFA 2026."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 18.00,
        "volume": 31200.0,
        "participants_count": 1280,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    # ── GOLEADOR DEL TORNEO ─────────────────────────────────────────────────────
    {
        "title": "¿Será Mbappé el goleador del Mundial 2026?",
        "description": (
            "Kylian Mbappé es el máximo favorito para quedarse con la Bota de Oro del Mundial 2026. "
            "En Qatar 2022 terminó como goleador con 8 tantos, incluyendo el histórico hat-trick en la final. "
            "A sus 27 años llega al torneo en la plenitud de su carrera y consolidado en el Real Madrid.\n\n"
            "Sus principales competidores serán Erling Haaland (Noruega), Vinicius Jr. (Brasil), "
            "Lautaro Martínez (Argentina) y Harry Kane (Inglaterra).\n\n"
            "Este mercado se resolverá como SÍ si Mbappé termina como máximo goleador del torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 19.00,
        "volume": 18700.0,
        "participants_count": 890,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    # ── FASE DE GRUPOS ──────────────────────────────────────────────────────────
    {
        "title": "¿Pasará Argentina la fase de grupos del Mundial 2026?",
        "description": (
            "Argentina integra el Grupo A junto a España, Marruecos y Arabia Saudita. "
            "Los partidos de la fase de grupos son:\n"
            "• Argentina vs Arabia Saudita — 14 de junio (Los Ángeles)\n"
            "• Argentina vs Marruecos — 19 de junio (Nueva York)\n"
            "• Argentina vs España — 25 de junio (Miami)\n\n"
            "En Qatar 2022, Argentina arrancó perdiendo 1-2 ante Arabia Saudita antes de remontar el torneo. "
            "El Grupo A es uno de los más competitivos, con España también como favorito a pasar de ronda.\n\n"
            "Este mercado se resolverá como SÍ si Argentina termina entre los dos primeros del Grupo A."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 82.00,
        "volume": 22400.0,
        "participants_count": 1120,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Marcará Argentina más de 5 goles en la fase de grupos?",
        "description": (
            "En sus tres partidos de la fase de grupos ante Arabia Saudita, Marruecos y España, "
            "¿logrará Argentina superar los 5 goles en total?\n\n"
            "Historial reciente de Argentina en fases de grupos de Mundiales:\n"
            "• Qatar 2022: 5 goles en 3 partidos (3-0 vs Polonia, 2-0 vs México, 1-2 vs Arabia Saudita)\n"
            "• Rusia 2018: 3 goles en 3 partidos\n"
            "• Brasil 2014: 6 goles en 3 partidos\n\n"
            "El promedio goleador de Argentina en Eliminatorias 2026 fue de 2.1 goles por partido. "
            "Con Messi, Lautaro y Álvarez en el ataque, se espera producción ofensiva.\n\n"
            "Este mercado se resolverá como SÍ si Argentina suma más de 5 goles en sus 3 partidos de grupos."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 54.00,
        "volume": 14800.0,
        "participants_count": 680,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Ganará Argentina a España en la fase de grupos?",
        "description": (
            "El partido más atractivo del Grupo A enfrenta a las dos últimas campeonas del mundo: "
            "Argentina (campeona 2022) y España (campeona 2010 y dominadora de la UEFA Nations League 2024).\n\n"
            "Head-to-head reciente Argentina vs España:\n"
            "• Jun 2023: Argentina 1-0 España (amistoso, gol Thiago Almada)\n"
            "• Jun 2022: Argentina 0-0 España (amistoso)\n"
            "• Mar 2018: España 6-1 Argentina (amistoso en Córdoba)\n"
            "• Nov 2009: Argentina 2-1 España (amistoso)\n"
            "• Jun 2008: España 1-0 Argentina (amistoso)\n\n"
            "El partido se juega el 25 de junio de 2026 en el Hard Rock Stadium de Miami. "
            "Ambas selecciones podrían llegar ya clasificadas, lo que podría afectar la alineación.\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana este partido (90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 38.00,
        "volume": 19600.0,
        "participants_count": 940,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
    },
    # ── ELIMINACIÓN DIRECTA ─────────────────────────────────────────────────────
    {
        "title": "¿Llegará Argentina a las semifinales del Mundial 2026?",
        "description": (
            "Argentina llega al Mundial como campeona defensora. El camino a las semifinales implicaría "
            "superar la fase de grupos, octavos y cuartos de final — tres partidos eliminatorios.\n\n"
            "En los últimos cuatro Mundiales, Argentina llegó a:\n"
            "• Qatar 2022: Campeón ✅\n"
            "• Rusia 2018: Octavos de final (eliminada por Francia 3-4)\n"
            "• Brasil 2014: Final (perdió ante Alemania en penales)\n"
            "• Sudáfrica 2010: Cuartos de final\n\n"
            "El cruce de cuartos dependería de los resultados de grupos, pero Argentina podría enfrentar a Brasil o Alemania.\n\n"
            "Este mercado se resolverá como SÍ si Argentina juega al menos una semifinal del Mundial 2026."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 48.00,
        "volume": 28900.0,
        "participants_count": 1340,
        "end_date": dt("2026-07-15"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Habrá prórroga en la final del Mundial 2026?",
        "description": (
            "Las finales mundiales han sido históricamente muy disputadas. En los últimos 10 finales:\n"
            "• Qatar 2022: Argentina 3-3 Francia (prórroga + penales) ✅\n"
            "• Rusia 2018: Francia 4-2 Croacia (sin prórroga)\n"
            "• Brasil 2014: Alemania 1-0 Argentina (prórroga) ✅\n"
            "• Sudáfrica 2010: España 1-0 Países Bajos (prórroga) ✅\n"
            "• Alemania 2006: Italia 1-1 Francia (prórroga + penales) ✅\n\n"
            "4 de las últimas 5 finales fueron a prórroga. La densidad táctica de los mejores equipos del mundo "
            "tiende a producir partidos muy cerrados en la instancia definitiva.\n\n"
            "Este mercado se resolverá como SÍ si la final del 19 de julio de 2026 llega a tiempo extra (minuto 90+)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 62.00,
        "volume": 16300.0,
        "participants_count": 720,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    # ── RÉCORDS Y ESTADÍSTICAS ──────────────────────────────────────────────────
    {
        "title": "¿Superará el Mundial 2026 los 172 goles totales de Qatar 2022?",
        "description": (
            "El Mundial 2026 tendrá 48 selecciones y 104 partidos (vs 32 equipos y 64 partidos en Qatar 2022), "
            "lo que hace casi seguro que se superará el récord de goles totales.\n\n"
            "Goles totales en últimas ediciones:\n"
            "• Qatar 2022: 172 goles en 64 partidos (2.69 por partido)\n"
            "• Rusia 2018: 169 goles en 64 partidos (2.64 por partido)\n"
            "• Brasil 2014: 171 goles en 64 partidos (2.67 por partido)\n\n"
            "Con 104 partidos y un promedio similar (2.6 goles/partido), el total esperado sería ~270 goles. "
            "La pregunta real es si el promedio por partido se mantendrá con más equipos de menor nivel participando.\n\n"
            "Este mercado se resolverá como SÍ si el total de goles del torneo supera los 172 de Qatar 2022."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 94.00,
        "volume": 8900.0,
        "participants_count": 410,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Llegará algún equipo latinoamericano a la final del Mundial 2026?",
        "description": (
            "Con el Mundial jugándose en territorio americano (USA, México, Canadá), "
            "se espera una fuerte presencia y apoyo a las selecciones latinoamericanas. "
            "Los candidatos principales de la región son Argentina (campeona), Brasil, Uruguay, Colombia y México.\n\n"
            "Últimas participaciones de CONMEBOL en finales:\n"
            "• Qatar 2022: Argentina campeón ✅\n"
            "• Rusia 2018: Sin final latinoamericana\n"
            "• Brasil 2014: Argentina finalista ✅\n"
            "• Sudáfrica 2010: Sin final latinoamericana\n"
            "• Alemania 2006: Sin final latinoamericana\n\n"
            "La localía en América y el favoritismo de Argentina y Brasil aumentan la probabilidad. "
            "México como anfitrión también aspira a superar por primera vez los cuartos de final.\n\n"
            "Este mercado se resolverá como SÍ si al menos uno de los finalistas del 19 de julio es de CONMEBOL o CONCACAF."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 71.00,
        "volume": 21500.0,
        "participants_count": 980,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    # ── MESSI ────────────────────────────────────────────────────────────────────
    {
        "title": "¿Anotará Messi en el Mundial 2026?",
        "description": (
            "Lionel Messi disputará el Mundial 2026 a los 38 años en lo que probablemente sea su último torneo mundialista. "
            "En Qatar 2022 fue el MVP del torneo con 7 goles y 3 asistencias.\n\n"
            "Historial goleador de Messi en Mundiales:\n"
            "• Qatar 2022: 7 goles ⚽⚽⚽⚽⚽⚽⚽\n"
            "• Rusia 2018: 1 gol\n"
            "• Brasil 2014: 4 goles\n"
            "• Sudáfrica 2010: 0 goles\n"
            "• Alemania 2006: 1 gol\n\n"
            "Total Mundial: 13 goles en 26 partidos. Messi anotó en 4 de sus 5 mundiales. "
            "Su estado físico en el Inter Miami y la selección sigue siendo destacable pese a la edad.\n\n"
            "Este mercado se resolverá como SÍ si Messi anota al menos 1 gol en el torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 74.00,
        "volume": 35600.0,
        "participants_count": 1680,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    {
        "title": "¿Será Messi el MVP (Balón de Oro) del Mundial 2026?",
        "description": (
            "Messi ganó el Balón de Oro del Mundial en Qatar 2022 convirtiéndose en el primer jugador en ganarlo dos veces "
            "(también lo ganó en 2014 pese a no ser campeón). A sus 38 años, ¿puede repetir?\n\n"
            "Ganadores recientes del Balón de Oro mundialista:\n"
            "• Qatar 2022: Lionel Messi 🏆\n"
            "• Rusia 2018: Luka Modrić\n"
            "• Brasil 2014: Lionel Messi 🏆\n"
            "• Sudáfrica 2010: Diego Forlán\n\n"
            "Los principales competidores serían Mbappé, Vinicius Jr., Bellingham y Pedri. "
            "Ganar el Balón de Oro requiere no solo buen rendimiento individual sino también que el equipo llegue lejos.\n\n"
            "Este mercado se resolverá como SÍ si Lionel Messi recibe el trofeo al mejor jugador del torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 21.00,
        "volume": 24100.0,
        "participants_count": 1090,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
    },
    # ── PARTIDOS ESPECÍFICOS ─────────────────────────────────────────────────────
    {
        "title": "¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?",
        "description": (
            "El primer partido de Argentina en el Mundial 2026 es contra Arabia Saudita el 14 de junio "
            "en el SoFi Stadium de Los Ángeles. En Qatar 2022, este mismo cruce provocó la mayor sorpresa "
            "del torneo: Arabia Saudita ganó 2-1.\n\n"
            "Forma reciente de Argentina (últimos 5 partidos):\n"
            "• Argentina 3-0 Bolivia (Eliminatorias)\n"
            "• Paraguay 0-1 Argentina (Eliminatorias)\n"
            "• Argentina 2-0 Chile (Eliminatorias)\n"
            "• Ecuador 0-1 Argentina (Eliminatorias)\n"
            "• Argentina 1-0 Venezuela (Eliminatorias)\n\n"
            "Forma reciente de Arabia Saudita (últimos 5 partidos):\n"
            "• Arabia Saudita 2-0 Kuwait (Eliminatorias Asia)\n"
            "• Jordania 1-2 Arabia Saudita\n"
            "• Arabia Saudita 1-1 Japón\n"
            "• Australia 0-1 Arabia Saudita\n"
            "• Arabia Saudita 3-1 Bahrein\n\n"
            "Head-to-head: Argentina 1 - Arabia Saudita 2 (solo se enfrentaron en Qatar 2022).\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana el partido del 14 de junio (resultado a 90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 76.00,
        "volume": 26800.0,
        "participants_count": 1230,
        "end_date": dt("2026-06-14"),
        "status": MarketStatus.ACTIVE,
    },
]


def seed_mundial_snapshots(db: Session, markets: list[Market]):
    snapshots = []
    now = datetime.now(timezone.utc)
    for market in markets:
        base_prob = float(market.probability_market)
        for days_ago in range(14, 0, -1):
            drift = (14 - days_ago) * (0.4 if days_ago % 3 != 0 else -0.5)
            prob = max(1.0, min(99.0, base_prob - 4 + drift))
            snapshots.append(
                MarketSnapshot(
                    market_id=market.id,
                    probability=round(prob, 1),
                    timestamp=now - timedelta(days=days_ago),
                )
            )
    db.add_all(snapshots)
    db.flush()
    print(f"  Created {len(snapshots)} snapshots")


def run():
    print("Seeding Mundial 2026 polls...")
    db: Session = SessionLocal()
    try:
        from app.models.market import MarketCategory as MC
        existing = db.query(Market).filter(Market.category == MC.MUNDIAL).count()
        if existing > 0:
            print(f"Already have {existing} Mundial polls. Skipping.")
            print("To reseed, delete Mundial markets first:")
            print("  DELETE FROM markets WHERE category='MUNDIAL';")
            return

        markets = []
        for data in MUNDIAL_POLLS:
            m = Market(
                title=data["title"],
                description=data["description"],
                category=data["category"],
                type=data["type"],
                probability_market=data["probability_market"],
                volume=data["volume"],
                participants_count=data["participants_count"],
                end_date=data["end_date"],
                status=data["status"],
            )
            markets.append(m)

        db.add_all(markets)
        db.flush()
        print(f"  Created {len(markets)} Mundial polls")

        seed_mundial_snapshots(db, markets)
        db.commit()
        print(f"\nDone! {len(markets)} polls del Mundial 2026 creados.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
