"""
Seed script — Mundial 2026 polls (14 mercados de predicción)

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
    # ── GANADOR DEL TORNEO ──────────────────────────────────────────────────
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
        "stats_data": {
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
                "descripcion": "Últimos 5 partidos de Argentina en Eliminatorias"
            },
            "historial_campeonatos": [
                {"año": 2022, "resultado": "Campeón 🏆", "goleador": "Mbappé (8)"},
                {"año": 2018, "resultado": "Octavos (vs Francia 3-4)"},
                {"año": 2014, "resultado": "Finalista (vs Alemania 0-1 AET)"},
                {"año": 2010, "resultado": "Cuartos de final"},
            ],
            "probabilidad_ia": 28.0,
            "favoritos": [
                {"pais": "Argentina", "prob": 28},
                {"pais": "Francia", "prob": 22},
                {"pais": "Brasil", "prob": 18},
                {"pais": "Inglaterra", "prob": 12},
                {"pais": "España", "prob": 10},
            ],
            "dato_clave": "Argentina llega como campeona defensora. Solo Brasil (1958-1962) repitió título consecutivo.",
        },
    },
    {
        "title": "¿Ganará Brasil el Mundial 2026?",
        "description": (
            "Brasil no gana un Mundial desde 2002 y llega al torneo como uno de los favoritos con una nueva generación liderada por Vinicius Jr., Rodrygo y Endrick. "
            "La selección canarinha tuvo una clasificación complicada en las Eliminatorias Sudamericanas pero llega en forma al torneo.\n\n"
            "El técnico Carlo Ancelotti apuesta por un sistema ofensivo con doble 9. "
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
        "stats_data": {
            "forma_reciente": {
                "Brasil": ["W", "W", "D", "W", "L"],
                "descripcion": "Últimos 5 partidos de Brasil"
            },
            "historial_campeonatos": [
                {"año": 2022, "resultado": "Cuartos de final (vs Croacia, penales)"},
                {"año": 2018, "resultado": "Cuartos (vs Bélgica 1-2)"},
                {"año": 2014, "resultado": "4° puesto (local, derrota 1-7 vs Alemania)"},
                {"año": 2002, "resultado": "Campeón 🏆 (último título)"},
            ],
            "probabilidad_ia": 22.0,
            "dato_clave": "Brasil no gana el Mundial desde 2002. Es el país con más títulos (5) pero acumula 24 años sin ganar.",
        },
    },
    {
        "title": "¿Ganará Francia el Mundial 2026?",
        "description": (
            "Francia llega al Mundial 2026 con uno de los planteles más talentosos del mundo. "
            "Mbappé lidera un equipo que fue campeón en 2018 y finalista en 2022.\n\n"
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
        "stats_data": {
            "forma_reciente": {
                "Francia": ["W", "W", "W", "W", "D"],
                "descripcion": "Últimos 5 partidos de Francia"
            },
            "historial_campeonatos": [
                {"año": 2022, "resultado": "Finalista (vs Argentina, penales)"},
                {"año": 2018, "resultado": "Campeón 🏆"},
                {"año": 2014, "resultado": "Cuartos de final"},
                {"año": 2006, "resultado": "Finalista (vs Italia, penales)"},
            ],
            "probabilidad_ia": 18.0,
            "dato_clave": "Francia fue finalista en la última edición. Mbappé marcó hat-trick en la final de Qatar 2022.",
        },
    },
    # ── GOLEADOR ────────────────────────────────────────────────────────────
    {
        "title": "¿Será Mbappé el goleador del Mundial 2026?",
        "description": (
            "Kylian Mbappé es el máximo favorito para quedarse con la Bota de Oro del Mundial 2026. "
            "En Qatar 2022 terminó como goleador con 8 tantos, incluyendo el histórico hat-trick en la final.\n\n"
            "Este mercado se resolverá como SÍ si Mbappé termina como máximo goleador del torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 19.00,
        "volume": 18700.0,
        "participants_count": 890,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "forma_reciente": {
                "Mbappé (PSG/Real Madrid)": ["⚽", "⚽⚽", "⚽", "–", "⚽"],
                "descripcion": "Goles en últimos 5 partidos con Francia"
            },
            "historial_bota_oro": [
                {"año": 2022, "goleador": "Mbappé", "goles": 8, "equipo": "Francia"},
                {"año": 2018, "goleador": "Kane", "goles": 6, "equipo": "Inglaterra"},
                {"año": 2014, "goleador": "Müller", "goles": 5, "equipo": "Alemania"},
                {"año": 2010, "goleador": "Müller/Villa/Sneijder/Forlán", "goles": 5},
            ],
            "probabilidad_ia": 19.0,
            "competidores": [
                {"jugador": "Mbappé", "pais": "Francia", "prob": 19},
                {"jugador": "Haaland", "pais": "Noruega", "prob": 15},
                {"jugador": "Vinicius Jr.", "pais": "Brasil", "prob": 12},
                {"jugador": "Lautaro Martínez", "pais": "Argentina", "prob": 11},
                {"jugador": "Kane", "pais": "Inglaterra", "prob": 9},
            ],
            "dato_clave": "Mbappé marcó 8 goles en Qatar 2022 — el torneo con 48 equipos implica más partidos y más oportunidades.",
        },
    },
    # ── FASE DE GRUPOS ───────────────────────────────────────────────────────
    {
        "title": "¿Pasará Argentina la fase de grupos del Mundial 2026?",
        "description": (
            "Argentina integra el Grupo A junto a España, Marruecos y Arabia Saudita.\n"
            "Partidos: vs Arabia Saudita (14 jun), vs Marruecos (19 jun), vs España (25 jun).\n\n"
            "Este mercado se resolverá como SÍ si Argentina termina entre los dos primeros del Grupo A."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 82.00,
        "volume": 22400.0,
        "participants_count": 1120,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "grupo_a": [
                {"pais": "Argentina", "ranking_fifa": 1, "prob_clasificar": 82},
                {"pais": "España", "ranking_fifa": 5, "prob_clasificar": 78},
                {"pais": "Marruecos", "ranking_fifa": 14, "prob_clasificar": 35},
                {"pais": "Arabia Saudita", "ranking_fifa": 56, "prob_clasificar": 12},
            ],
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
                "descripcion": "Últimos 5 partidos en Eliminatorias"
            },
            "antecedente": "En Qatar 2022 Argentina perdió contra Arabia Saudita en el debut pero igual clasificó primero.",
            "probabilidad_ia": 82.0,
            "dato_clave": "Argentina clasificó a todos los Mundiales desde 1974. Solo en 2002 quedó eliminada en grupos.",
        },
    },
    {
        "title": "¿Marcará Argentina más de 5 goles en la fase de grupos?",
        "description": (
            "En sus tres partidos de la fase de grupos ante Arabia Saudita, Marruecos y España, "
            "¿logrará Argentina superar los 5 goles en total?\n\n"
            "Este mercado se resolverá como SÍ si Argentina suma más de 5 goles en sus 3 partidos de grupos."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 54.00,
        "volume": 14800.0,
        "participants_count": 680,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_goles_grupos": [
                {"mundial": "Qatar 2022", "goles": 5, "partidos": 3, "promedio": 1.67},
                {"mundial": "Rusia 2018", "goles": 3, "partidos": 3, "promedio": 1.0},
                {"mundial": "Brasil 2014", "goles": 6, "partidos": 3, "promedio": 2.0},
                {"mundial": "Sudáfrica 2010", "goles": 3, "partidos": 3, "promedio": 1.0},
            ],
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
                "goles_ultimos_5": 12,
                "descripcion": "12 goles en últimos 5 partidos (Eliminatorias)"
            },
            "probabilidad_ia": 54.0,
            "dato_clave": "Argentina promedió 2.1 goles por partido en Eliminatorias 2026. Rival más fácil: Arabia Saudita.",
        },
    },
    {
        "title": "¿Ganará Argentina a España en la fase de grupos?",
        "description": (
            "El partido del Grupo A entre Argentina (campeona 2022) y España (campeona 2010). "
            "Se juega el 25 de junio en el Hard Rock Stadium de Miami.\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana este partido (90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 38.00,
        "volume": 19600.0,
        "participants_count": 940,
        "end_date": dt("2026-06-25"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "head_to_head": [
                {"fecha": "Jun 2023", "resultado": "Argentina 1-0 España", "tipo": "Amistoso"},
                {"fecha": "Jun 2022", "resultado": "Argentina 0-0 España", "tipo": "Amistoso"},
                {"fecha": "Mar 2018", "resultado": "España 6-1 Argentina", "tipo": "Amistoso"},
                {"fecha": "Nov 2009", "resultado": "Argentina 2-1 España", "tipo": "Amistoso"},
                {"fecha": "Jun 2008", "resultado": "España 1-0 Argentina", "tipo": "Amistoso"},
            ],
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
                "España": ["W", "W", "W", "W", "W"],
            },
            "probabilidad_ia": 38.0,
            "balance_h2h": {"Argentina": 2, "Empates": 1, "España": 2},
            "dato_clave": "Argentina ganó el último enfrentamiento (jun 2023). España viene en racha invicta de 15 partidos.",
        },
    },
    # ── ELIMINACIÓN DIRECTA ──────────────────────────────────────────────────
    {
        "title": "¿Llegará Argentina a las semifinales del Mundial 2026?",
        "description": (
            "Argentina llega como campeona defensora. El camino a semis implica superar grupos, octavos y cuartos.\n\n"
            "Este mercado se resolverá como SÍ si Argentina juega al menos una semifinal del Mundial 2026."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 48.00,
        "volume": 28900.0,
        "participants_count": 1340,
        "end_date": dt("2026-07-15"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_mundiales": [
                {"mundial": "Qatar 2022", "fase": "Campeón 🏆"},
                {"mundial": "Rusia 2018", "fase": "Octavos (vs Francia 3-4)"},
                {"mundial": "Brasil 2014", "fase": "Final (vs Alemania 0-1 AET)"},
                {"mundial": "Sudáfrica 2010", "fase": "Cuartos de final"},
                {"mundial": "Alemania 2006", "fase": "Cuartos de final"},
            ],
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
            },
            "probabilidad_ia": 48.0,
            "dato_clave": "Argentina llegó a semis o más en 3 de los últimos 5 Mundiales.",
        },
    },
    {
        "title": "¿Habrá prórroga en la final del Mundial 2026?",
        "description": (
            "Las finales mundiales han sido históricamente muy disputadas. ¿La final del 19 de julio llegará al tiempo extra?\n\n"
            "Este mercado se resolverá como SÍ si la final llega a tiempo extra (minuto 90+)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 62.00,
        "volume": 16300.0,
        "participants_count": 720,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_finales": [
                {"año": 2022, "final": "Argentina 3-3 Francia", "prorroga": True, "penales": True},
                {"año": 2018, "final": "Francia 4-2 Croacia", "prorroga": False, "penales": False},
                {"año": 2014, "final": "Alemania 1-0 Argentina (AET)", "prorroga": True, "penales": False},
                {"año": 2010, "final": "España 1-0 Países Bajos (AET)", "prorroga": True, "penales": False},
                {"año": 2006, "final": "Italia 1-1 Francia (AET+pen)", "prorroga": True, "penales": True},
            ],
            "probabilidad_ia": 62.0,
            "dato_clave": "4 de las últimas 5 finales fueron a prórroga (80%). La densidad táctica de los mejores equipos genera partidos muy cerrados.",
        },
    },
    # ── RÉCORDS ──────────────────────────────────────────────────────────────
    {
        "title": "¿Superará el Mundial 2026 los 172 goles totales de Qatar 2022?",
        "description": (
            "El Mundial 2026 tendrá 48 selecciones y 104 partidos vs 32 equipos y 64 partidos en Qatar.\n\n"
            "Este mercado se resolverá como SÍ si el total de goles supera los 172 de Qatar 2022."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 94.00,
        "volume": 8900.0,
        "participants_count": 410,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_goles_totales": [
                {"mundial": "Qatar 2022", "goles": 172, "partidos": 64, "promedio": 2.69},
                {"mundial": "Rusia 2018", "goles": 169, "partidos": 64, "promedio": 2.64},
                {"mundial": "Brasil 2014", "goles": 171, "partidos": 64, "promedio": 2.67},
                {"mundial": "Sudáfrica 2010", "goles": 145, "partidos": 64, "promedio": 2.27},
            ],
            "proyeccion_2026": {
                "partidos": 104,
                "promedio_esperado": 2.65,
                "goles_proyectados": 276,
            },
            "probabilidad_ia": 94.0,
            "dato_clave": "Con 104 partidos y promedio similar, se esperan ~270 goles. Superar 172 es casi seguro.",
        },
    },
    {
        "title": "¿Llegará algún equipo latinoamericano a la final del Mundial 2026?",
        "description": (
            "Con el Mundial en territorio americano, ¿habrá un finalista de CONMEBOL o CONCACAF?\n\n"
            "Este mercado se resolverá como SÍ si al menos uno de los finalistas es de CONMEBOL o CONCACAF."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 71.00,
        "volume": 21500.0,
        "participants_count": 980,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_finales_latam": [
                {"año": 2022, "finalista_latam": "Argentina 🏆", "resultado": "SÍ"},
                {"año": 2018, "finalista_latam": "Ninguno", "resultado": "NO"},
                {"año": 2014, "finalista_latam": "Argentina", "resultado": "SÍ"},
                {"año": 2010, "finalista_latam": "Ninguno", "resultado": "NO"},
                {"año": 2006, "finalista_latam": "Ninguno", "resultado": "NO"},
            ],
            "candidatos_latam": [
                {"pais": "Argentina", "ranking_fifa": 1, "prob_final": 28},
                {"pais": "Brasil", "ranking_fifa": 4, "prob_final": 22},
                {"pais": "Uruguay", "ranking_fifa": 17, "prob_final": 8},
                {"pais": "Colombia", "ranking_fifa": 9, "prob_final": 6},
                {"pais": "México", "ranking_fifa": 15, "prob_final": 4, "nota": "Anfitrión"},
            ],
            "probabilidad_ia": 71.0,
            "dato_clave": "La localía favorece a CONMEBOL/CONCACAF. Argentina y Brasil juntos tienen 50% de chance de llegar a la final.",
        },
    },
    # ── MESSI ────────────────────────────────────────────────────────────────
    {
        "title": "¿Anotará Messi en el Mundial 2026?",
        "description": (
            "Messi disputará el Mundial 2026 a los 38 años. En Qatar 2022 fue MVP con 7 goles y 3 asistencias.\n\n"
            "Este mercado se resolverá como SÍ si Messi anota al menos 1 gol en el torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 74.00,
        "volume": 35600.0,
        "participants_count": 1680,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_goles_messi": [
                {"mundial": "Qatar 2022", "goles": 7, "asistencias": 3, "nota": "MVP 🏆"},
                {"mundial": "Rusia 2018", "goles": 1, "asistencias": 0},
                {"mundial": "Brasil 2014", "goles": 4, "asistencias": 1, "nota": "MVP (sin título)"},
                {"mundial": "Sudáfrica 2010", "goles": 0, "asistencias": 2},
                {"mundial": "Alemania 2006", "goles": 1, "asistencias": 1},
            ],
            "forma_reciente": {
                "Messi": ["⚽", "⚽⚽", "–", "⚽", "⚽"],
                "descripcion": "Goles en últimos 5 partidos con Argentina/Inter Miami"
            },
            "probabilidad_ia": 74.0,
            "dato_clave": "Messi anotó en 4 de sus 5 Mundiales. Total: 13 goles en 26 partidos mundialistas.",
        },
    },
    {
        "title": "¿Será Messi el MVP (Balón de Oro) del Mundial 2026?",
        "description": (
            "Messi ganó el Balón de Oro en Qatar 2022 y en Brasil 2014. ¿Puede repetir a los 38 años?\n\n"
            "Este mercado se resolverá como SÍ si Messi recibe el trofeo al mejor jugador del torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 21.00,
        "volume": 24100.0,
        "participants_count": 1090,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "historial_balon_oro_mundial": [
                {"año": 2022, "ganador": "Messi 🏆", "equipo": "Argentina"},
                {"año": 2018, "ganador": "Modrić", "equipo": "Croacia"},
                {"año": 2014, "ganador": "Messi 🏆", "equipo": "Argentina"},
                {"año": 2010, "ganador": "Forlán", "equipo": "Uruguay"},
                {"año": 2006, "ganador": "Zidane", "equipo": "Francia"},
            ],
            "competidores": [
                {"jugador": "Messi", "prob": 21},
                {"jugador": "Mbappé", "prob": 25},
                {"jugador": "Vinicius Jr.", "prob": 18},
                {"jugador": "Bellingham", "prob": 14},
                {"jugador": "Pedri", "prob": 10},
            ],
            "probabilidad_ia": 21.0,
            "dato_clave": "Messi es el único jugador en ganar el Balón de Oro mundial dos veces. Mbappé es el favorito por edad y estado de forma.",
        },
    },
    # ── PARTIDO ESPECÍFICO ───────────────────────────────────────────────────
    {
        "title": "¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?",
        "description": (
            "El primer partido de Argentina es contra Arabia Saudita el 14 de junio en el SoFi Stadium de Los Ángeles. "
            "En Qatar 2022, Arabia Saudita ganó 2-1 en la mayor sorpresa del torneo.\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana el partido del 14 de junio (resultado a 90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 76.00,
        "volume": 26800.0,
        "participants_count": 1230,
        "end_date": dt("2026-06-14"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "head_to_head": [
                {"fecha": "Nov 2022", "resultado": "Arabia Saudita 2-1 Argentina", "tipo": "Qatar 2022 — Fase de grupos"},
            ],
            "forma_reciente": {
                "Argentina": ["W", "W", "W", "D", "W"],
                "Arabia Saudita": ["W", "D", "W", "L", "W"],
            },
            "stats_torneo": {
                "Argentina_eliminatorias": {"partidos": 18, "ganados": 12, "empatados": 4, "perdidos": 2, "goles_favor": 35, "goles_contra": 14},
                "Arabia_eliminatorias": {"partidos": 18, "ganados": 11, "empatados": 3, "perdidos": 4},
            },
            "probabilidad_ia": 76.0,
            "balance_h2h": {"Argentina": 0, "Empates": 0, "Arabia Saudita": 1},
            "dato_clave": "El único antecedente es la derrota de Argentina en Qatar 2022. Argentina viene invicta en las últimas 20 fechas FIFA.",
        },
    },
]


def seed_mundial_snapshots(db: Session, markets: list):
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
        existing = db.query(Market).filter(Market.category == MarketCategory.MUNDIAL).count()
        if existing > 0:
            print(f"Already have {existing} Mundial polls. Skipping.")
            print("To reseed: DELETE FROM markets WHERE category='MUNDIAL';")
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
                stats_data=data.get("stats_data"),
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
