"""
Configuración de categorías y filtros para la generación automática de polls
a partir de tendencias de Google Trends (Argentina).
"""

CATEGORIAS: dict[str, dict] = {
    "politica": {
        "geo": "AR",
        "keywords_include": [
            "milei", "gobierno", "congreso", "elecciones", "senado", "diputados",
            "lula", "maduro", "boric", "petro", "presidente", "ministro",
            "kirchner", "massa", "bullrich", "larreta", "macri", "partido",
            "voto", "reforma", "ley ", "decreto", "oposicion", "oficialismo",
            "protest", "paro", "huelga", "marcha",
            "terremoto", "seismo", "catastrofe", "inundacion", "tsunami",
            "guerra ", "conflicto", "trump", "biden", "zelensky", "putin",
            "onu ", "g20", "cumbre", "tratado", "sancion",
        ],
        "probabilidad_default": 50.0,
    },
    "economia": {
        "geo": "AR",
        "keywords_include": [
            "dolar", "inflacion", "fmi", "reservas", "pesos", "banco",
            "mercado", "deuda", "cepo", "tasas", "bcra", "economia",
            "recesion", "empleo", "desempleo", "salario", "precio",
            "exportacion", "importacion", "deficit", "superavit",
            "bonos", "acciones", "bolsa", "indec", "canasta",
        ],
        "probabilidad_default": 45.0,
    },
    "deportes": {
        "geo": "AR",
        "keywords_include": [
            "boca", "river", "seleccion", "mundial", "champions", "libertadores",
            "nba", "tenis", "formula 1", "messi", "transferencia", "futbol",
            "copa", "torneo", "liga", "gol", "partido", "campeon",
            "atletismo", "natacion", "rugby", "basquet", "handball",
            "olimpiadas", "juegos panamericanos",
            # técnicos y jugadores argentinos frecuentes en trends
            "mohamed", "gallardo", "scaloni", "demichelis", "heinze",
            "cerundolo", "schwartzman", "del potro", "perez", "kicillof",
            "afa ", "san lorenzo", "independiente", "racing", "huracan",
            "estudiantes", "gimnasia", "velez", "lanus", "belgrano",
            "newells", "central", "talleres", "atletico tucuman",
        ],
        "probabilidad_default": 55.0,
    },
    "crypto": {
        "geo": "AR",
        "keywords_include": [
            "bitcoin", "btc", "ethereum", "eth", "crypto", "criptomoneda",
            "blockchain", "defi", "nft", "binance", "stablecoin", "usdt",
            "usdc", "altcoin", "mining", "mineria", "wallet", "exchange",
            "regulacion crypto", "sec crypto", "halving",
        ],
        "probabilidad_default": 50.0,
    },
    "tecnologia": {
        "geo": "AR",
        "keywords_include": [
            "inteligencia artificial", " ia ", "openai", "chatgpt", "gemini",
            "apple", "iphone", "google", "microsoft", "meta ", "amazon",
            "startup", "unicornio", "mercadolibre", "globant", "despegar",
            "satellite", "spacex", "starlink", "5g", "chip", "semiconductor",
            "deepseek", "llama", "gpt",
        ],
        "probabilidad_default": 50.0,
    },
}

# Temas que se descartan sin importar la categoría
KEYWORDS_EXCLUIR: list[str] = [
    "novela", "serie", "pelicula", "netflix", "disney", "hbo",
    "youtube", "tiktok", "instagram", "twitter", "x.com",
    "meme", "viral", "cumpleaños", "fallecio", "fallecida", "murio",
    "muerte de", "aniversario", "boda", "casamiento", "divorci",
    "actor", "actriz", "cantante", "musico", "album", "cancion",
    "reality", "gran hermano",
    # clima / tiempo — no generan buenos polls de predicción
    "el tiempo en", "tiempo en", "clima en", "temperatura",
    "windy", "accuweather", "meteored", "pronostico",
    # sitios/apps — no son eventos predecibles
    "lu24", "infobae", "clarin", "lanacion", "pagina 12",
]

MAX_POLLS_POR_DIA = 5
DIAS_DURACION_POLL = 30
