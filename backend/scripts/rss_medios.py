"""
rss_medios.py — Extrae titulares de medios argentinos via RSS como fuente
complementaria a Google Trends para auto_polls.py.

Fuentes activas (verificadas 2026-08):
  Clarín  — feeds por sección (economía, política, deportes, tecnología)
  Ámbito  — feeds por sección (economía, política, finanzas, criptomonedas)

Cada sección mapea directamente a una categoría de la app.
Los titulares se limpian y deduplicán contra los topics de Google Trends.
"""

import re
import unicodedata
import urllib.request
from html import unescape

# Timeout por feed (segundos)
_TIMEOUT = 8
_UA = "Mozilla/5.0 (compatible; PredictaX/1.0)"

# Feeds por categoría — (nombre_display, url)
FEEDS_POR_CATEGORIA: dict[str, list[tuple[str, str]]] = {
    "economia": [
        ("Clarin/economia",   "https://www.clarin.com/rss/economia/"),
        ("Ambito/economia",   "https://www.ambito.com/rss/pages/economia.xml"),
        ("Ambito/finanzas",   "https://www.ambito.com/rss/pages/finanzas.xml"),
    ],
    "politica": [
        ("Clarin/politica",   "https://www.clarin.com/rss/politica/"),
        ("Ambito/politica",   "https://www.ambito.com/rss/pages/politica.xml"),
    ],
    "deportes": [
        ("Clarin/deportes",   "https://www.clarin.com/rss/deportes/"),
    ],
    "tecnologia": [
        ("Clarin/tecnologia", "https://www.clarin.com/rss/tecnologia/"),
    ],
    "crypto": [
        ("Ambito/crypto",     "https://www.ambito.com/rss/pages/criptomonedas.xml"),
    ],
}

# Titulares más cortos que esto probablemente son headers del feed, no noticias
_MIN_TITULO_LEN = 20


def _normalizar(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _limpiar_titulo(raw: str) -> str:
    """Decodifica HTML entities y elimina pipe/guión con nombre del medio al final."""
    texto = unescape(raw).strip()
    # Quitar sufijos tipo " | Ámbito" o " - Clarín"
    texto = re.sub(r"\s*[\|–\-]\s*(Clarín|Clarin|Ámbito|Ambito|La Nacion|LA NACION).*$", "", texto, flags=re.IGNORECASE)
    return texto.strip()


def _fetch_titulares(url: str) -> list[str]:
    """Descarga un feed RSS y devuelve lista de títulos de ítems."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": _UA})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as r:
            content = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[rss] ERROR al descargar {url}: {e}")
        return []

    # Extraer <title> dentro de <item> solamente
    items_raw = re.findall(r"<item[^>]*>(.*?)</item>", content, re.DOTALL)
    titulos = []
    for item in items_raw:
        match = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", item, re.DOTALL)
        if match:
            titulo = _limpiar_titulo(match.group(1))
            if len(titulo) >= _MIN_TITULO_LEN:
                titulos.append(titulo)
    return titulos


def get_topics_from_rss(excluir_topics: list[str] | None = None) -> list[tuple[str, str]]:
    """
    Devuelve lista de (titulo, categoria) extraídos de los feeds RSS.

    Args:
        excluir_topics: títulos ya obtenidos de Google Trends (para no repetir)

    Returns:
        Lista de (titulo_noticia, categoria) sin duplicados internos ni contra excluir_topics.
    """
    excluir_norm = {_normalizar(t) for t in (excluir_topics or [])}
    vistos: set[str] = set()
    resultado: list[tuple[str, str]] = []

    for categoria, feeds in FEEDS_POR_CATEGORIA.items():
        for nombre, url in feeds:
            titulares = _fetch_titulares(url)
            print(f"[rss] {nombre}: {len(titulares)} titulares")
            for titulo in titulares:
                norm = _normalizar(titulo)
                # Descartar si ya está en Google Trends o ya lo agregamos
                if norm in excluir_norm or norm in vistos:
                    continue
                vistos.add(norm)
                resultado.append((titulo, categoria))

    print(f"[rss] Total topics nuevos desde medios: {len(resultado)}")
    return resultado
