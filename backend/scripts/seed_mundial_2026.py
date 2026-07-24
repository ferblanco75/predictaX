# ruff: noqa: E501
"""
Seed script — Mundial 2026 polls (14 mercados de predicción)

Usage:
    docker compose exec backend python scripts/seed_mundial_2026.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone

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
            "El equipo de Lionel Scaloni mantiene la columna vertebral del plantel campeón y suma figuras jóvenes como Lautaro Martínez, Julián Álvarez y Enzo Fernández.\n\n"
            "Lionel Messi, a sus 38 años, ya anotó un hat-trick en el debut (3-0 vs Algeria). "
            "Argentina integra el Grupo J junto a Algeria, Austria y Jordan.\n\n"
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
                {"año": 2018, "resultado": "Octavos (vs Francia 4-3)"},
                {"año": 2014, "resultado": "Finalista (vs Alemania 0-1 AET, gol Götze)"},
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
            "Brasil no gana un Mundial desde 2002 y llega al torneo como uno de los favoritos con una nueva generación liderada por Vinicius Jr., Neymar y Endrick. "
            "La selección canarinha tuvo una clasificación complicada en las Eliminatorias Sudamericanas pero llega en forma al torneo.\n\n"
            "El técnico Carlo Ancelotti apuesta por un sistema ofensivo. "
            "Brasil integra el Grupo C junto a Marruecos, Haití y Escocia.\n\n"
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
            "Mbappé, ahora en el Real Madrid, lidera un equipo que fue campeón en 2018 y finalista en 2022. "
            "Deschamps cuenta con Camavinga, Tchouaméni, Olise, Cherki y una defensa sólida.\n\n"
            "El técnico Didier Deschamps busca su segundo título mundial como entrenador en su último torneo al frente de Les Bleus. "
            "Francia integra el Grupo I junto a Senegal, Irak y Noruega.\n\n"
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
        "fixture_id": 537397,
        "title": "¿Ganará Argentina a Algeria en su debut del Mundial 2026?",
        "description": (
            "El primer partido de Argentina en el Mundial 2026 fue contra Algeria el 16 de junio en el Arrowhead Stadium de Kansas City. "
            "Argentina ganó 3-0 con hat-trick de Lionel Messi, igualando el récord de 16 goles mundialistas de Miroslav Klose.\n\n"
            "Este mercado se resolvió como SÍ: Argentina ganó 3-0."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 99.00,
        "volume": 26800.0,
        "participants_count": 1230,
        "end_date": dt("2026-06-16"),
        "status": MarketStatus.RESOLVED,
        "stats_data": {
            "resultado_final": "Argentina 3-0 Algeria",
            "goles": [
                {"jugador": "Messi", "minuto": 17},
                {"jugador": "Messi", "minuto": 60},
                {"jugador": "Messi", "minuto": 76},
            ],
            "dato_clave": "Hat-trick de Messi en su debut mundialista. Iguala récord de Klose con 16 goles en Mundiales.",
        },
    },
    {
        "fixture_id": 537399,
        "title": "¿Ganará Argentina a Austria en la fase de grupos del Mundial 2026?",
        "description": (
            "Segundo partido de Argentina en el Grupo J. Se juega el 22 de junio en el AT&T Stadium de Arlington, Texas.\n\n"
            "Argentina viene de golear 3-0 a Algeria con hat-trick de Messi. Austria busca dar la sorpresa ante la campeona defensora.\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana el partido (resultado a 90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 78.00,
        "volume": 19600.0,
        "participants_count": 940,
        "end_date": dt("2026-06-22"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "grupo_j": [
                {"pais": "Argentina", "prob_clasificar": 92},
                {"pais": "Austria", "prob_clasificar": 55},
                {"pais": "Algeria", "prob_clasificar": 25},
                {"pais": "Jordan", "prob_clasificar": 8},
            ],
            "dato_clave": "Argentina llega con 3 puntos y +3 de diferencia de gol tras golear a Algeria.",
        },
    },
    {
        "title": "¿Pasará Argentina la fase de grupos del Mundial 2026?",
        "description": (
            "Argentina integra el Grupo J junto a Algeria, Austria y Jordan. Los partidos de la fase de grupos son:\n"
            "• Argentina vs Algeria — 16 de junio (Kansas City) — Resultado: Argentina 3-0 ✅\n"
            "• Argentina vs Austria — 22 de junio (Arlington, Texas)\n"
            "• Jordan vs Argentina — 27 de junio (Arlington, Texas)\n\n"
            "En el formato de 48 equipos, clasifican los 2 primeros de cada grupo y los 8 mejores terceros.\n\n"
            "Este mercado se resolverá como SÍ si Argentina avanza a la ronda de 32."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 95.00,
        "volume": 22400.0,
        "participants_count": 1120,
        "end_date": dt("2026-06-27"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "grupo_j": [
                {"pais": "Argentina", "pts": 3, "gf": 3, "gc": 0},
                {"pais": "Austria", "pts": 0, "gf": 0, "gc": 0},
                {"pais": "Algeria", "pts": 0, "gf": 0, "gc": 3},
                {"pais": "Jordan", "pts": 0, "gf": 0, "gc": 0},
            ],
            "dato_clave": "Argentina ya ganó su primer partido 3-0. Con 3 puntos, está muy cerca de clasificar.",
        },
    },
    {
        "title": "¿Marcará Argentina más de 5 goles en la fase de grupos?",
        "description": (
            "En sus tres partidos de la fase de grupos ante Algeria, Austria y Jordan, "
            "¿logrará Argentina superar los 5 goles en total?\n\n"
            "Ya lleva 3 goles (hat-trick de Messi vs Algeria). Faltan los partidos contra Austria (22 jun) y Jordan (27 jun).\n\n"
            "Historial en fases de grupos:\n"
            "• Qatar 2022: 5 goles en 3 partidos\n"
            "• Brasil 2014: 6 goles en 3 partidos\n"
            "• Rusia 2018: 3 goles en 3 partidos\n\n"
            "Este mercado se resolverá como SÍ si Argentina suma más de 5 goles en sus 3 partidos de grupos."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 72.00,
        "volume": 14800.0,
        "participants_count": 680,
        "end_date": dt("2026-06-27"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "goles_actuales": 3,
            "partidos_jugados": 1,
            "partidos_restantes": 2,
            "historial_goles_grupos": [
                {"mundial": "Qatar 2022", "goles": 5},
                {"mundial": "Brasil 2014", "goles": 6},
                {"mundial": "Rusia 2018", "goles": 3},
            ],
            "dato_clave": "Con 3 goles en 1 partido, Argentina necesita solo 3 más en 2 partidos para superar la marca.",
        },
    },
    # ── ELIMINACIÓN DIRECTA ──────────────────────────────────────────────────
    {
        "title": "¿Llegará Argentina a las semifinales del Mundial 2026?",
        "description": (
            "Argentina llega al Mundial como campeona defensora. El camino a las semifinales implicaría superar la fase de grupos, "
            "la ronda de 32, octavos y cuartos de final.\n\n"
            "En los últimos cuatro Mundiales, Argentina llegó a:\n"
            "• Qatar 2022: Campeón ✅\n"
            "• Rusia 2018: Octavos de final (eliminada por Francia 4-3)\n"
            "• Brasil 2014: Final (perdió ante Alemania 1-0 en tiempo extra)\n"
            "• Sudáfrica 2010: Cuartos de final\n\n"
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
                {"mundial": "Rusia 2018", "fase": "Octavos (vs Francia 4-3)"},
                {"mundial": "Brasil 2014", "fase": "Final (vs Alemania 0-1 AET, gol Götze)"},
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
            "Lionel Messi disputará el Mundial 2026 a los 38 años en su sexto torneo mundialista. "
            "En el debut contra Algeria (16 de junio), Messi anotó un hat-trick histórico para el 3-0, "
            "igualando el récord de 16 goles mundialistas de Miroslav Klose.\n\n"
            "Historial goleador de Messi en Mundiales:\n"
            "• USA/CAN/MEX 2026: 3 goles (en curso) ⚽⚽⚽\n"
            "• Qatar 2022: 7 goles (MVP 🏆)\n"
            "• Rusia 2018: 1 gol\n"
            "• Brasil 2014: 4 goles (MVP)\n"
            "• Sudáfrica 2010: 0 goles\n"
            "• Alemania 2006: 1 gol\n\n"
            "Total: 16 goles en 27 partidos. Messi anotó en 5 de sus 6 mundiales.\n\n"
            "Este mercado se resolverá como SÍ si Messi anota al menos 1 gol en el torneo."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 99.00,
        "volume": 35600.0,
        "participants_count": 1680,
        "end_date": dt("2026-07-19"),
        "status": MarketStatus.RESOLVED,
        "stats_data": {
            "historial_goles_messi": [
                {"mundial": "USA/CAN/MEX 2026", "goles": 3, "asistencias": 0, "nota": "En curso ⚽⚽⚽"},
                {"mundial": "Qatar 2022", "goles": 7, "asistencias": 3, "nota": "MVP 🏆"},
                {"mundial": "Rusia 2018", "goles": 1, "asistencias": 0},
                {"mundial": "Brasil 2014", "goles": 4, "asistencias": 1, "nota": "MVP (sin título)"},
                {"mundial": "Sudáfrica 2010", "goles": 0, "asistencias": 2},
                {"mundial": "Alemania 2006", "goles": 1, "asistencias": 1},
            ],
            "probabilidad_ia": 99.0,
            "dato_clave": "RESUELTO: Messi anotó hat-trick vs Algeria el 16/06. Total: 16 goles mundialistas, récord igualado con Klose.",
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
        "fixture_id": 537401,
        "title": "¿Ganará Argentina a Jordan en la fase de grupos del Mundial 2026?",
        "description": (
            "Tercer y último partido de Argentina en el Grupo J. Se juega el 27 de junio en el AT&T Stadium de Arlington, Texas.\n\n"
            "Jordan clasifica a un Mundial por primera vez en su historia. Argentina llega como campeona defensora "
            "con Messi en estado de gracia tras su hat-trick en el debut.\n\n"
            "Este mercado se resolverá como SÍ si Argentina gana el partido (resultado a 90 minutos)."
        ),
        "category": MarketCategory.MUNDIAL,
        "type": MarketType.BINARY,
        "probability_market": 85.00,
        "volume": 16200.0,
        "participants_count": 720,
        "end_date": dt("2026-06-27"),
        "status": MarketStatus.ACTIVE,
        "stats_data": {
            "grupo_j": [
                {"pais": "Argentina", "prob_clasificar": 92},
                {"pais": "Austria", "prob_clasificar": 55},
                {"pais": "Algeria", "prob_clasificar": 25},
                {"pais": "Jordan", "prob_clasificar": 8},
            ],
            "probabilidad_ia": 85.0,
            "dato_clave": "Jordan debuta en un Mundial. Argentina es amplia favorita en el cierre de grupo.",
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
                fixture_id=data.get("fixture_id"),
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
