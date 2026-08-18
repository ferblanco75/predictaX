"""
auto_polls.py — Genera polls automáticamente a partir de tendencias en Argentina.

Flujo:
  1. Obtiene trending topics de Argentina via pytrends
  2. Clasifica cada tema en una categoría (política, economía, etc.)
  3. Genera título + descripción con Gemini Flash
  4. Verifica que el poll no exista ya en la app
  5. Crea el poll via POST /api/admin/markets

Uso local:
  cd backend
  pip install pytrends google-genai python-Levenshtein requests
  BACKEND_URL=http://localhost:8001 ADMIN_EMAIL=admin@predictax.com \
  ADMIN_PASS=admin1234 GEMINI_API_KEY=<key> python scripts/auto_polls.py

En GitHub Actions: las variables de entorno las inyecta el workflow.
"""

import json
import os
import sys
import time
import unicodedata
from datetime import datetime, timedelta, timezone

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.trends_config import (
    CATEGORIAS,
    DIAS_DURACION_POLL,
    KEYWORDS_EXCLUIR,
    MAX_POLLS_POR_DIA,
)

# ── Configuración desde variables de entorno ──────────────────────────────────

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@predictax.com")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "admin1234")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")


# ── Utilidades ────────────────────────────────────────────────────────────────

def _normalizar(texto: str) -> str:
    """Minúsculas sin tildes para comparaciones."""
    nfkd = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _similitud_levenshtein(a: str, b: str) -> float:
    """Distancia de Levenshtein normalizada (0 = idénticos, 1 = totalmente distintos)."""
    a, b = _normalizar(a), _normalizar(b)
    if not a or not b:
        return 1.0
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            dp[j] = prev[j - 1] if a[i - 1] == b[j - 1] else 1 + min(dp[j], dp[j - 1], prev[j])
    return dp[n] / max(m, n)


# ── Paso 1: Obtener tendencias ────────────────────────────────────────────────

def get_trending_topics(geo: str = "AR") -> list[str]:
    """Devuelve lista de temas en tendencia via TrendsRSS (feed oficial de Google)."""
    try:
        from pytrends_modern.rss import TrendsRSS
    except ImportError:
        print("ERROR: pytrends-modern no está instalado.")
        print("  pip install git+https://github.com/yiromo/pytrends-modern")
        sys.exit(1)

    print(f"[trends] Consultando trending topics en {geo} via TrendsRSS...")
    rss = TrendsRSS()

    try:
        results = rss.get_trends(
            geo=geo,
            output_format="dict",
            include_images=False,
            include_articles=False,
        )
        # Ordenar por tráfico descendente y extraer títulos
        results_sorted = sorted(results, key=lambda x: x.get("traffic", 0), reverse=True)
        topics = [r["title"] for r in results_sorted if r.get("title")]
        print(f"[trends] {len(topics)} temas obtenidos (top tráfico: {results_sorted[0].get('traffic', '?') if results_sorted else 0})")
        return topics
    except Exception as e:
        print(f"[trends] ERROR: {e}")
        return []


# ── Paso 2: Clasificar tema en categoría ─────────────────────────────────────

def clasificar_tema(tema: str) -> tuple[str, float] | None:
    """
    Retorna (categoria, probabilidad_default) si el tema encaja en alguna
    categoría, o None si debe descartarse.
    """
    tema_norm = _normalizar(tema)

    # Descartar temas en lista negra
    for excluir in KEYWORDS_EXCLUIR:
        if _normalizar(excluir) in tema_norm:
            print(f"[clasificar] Descartado (lista negra): {tema!r}")
            return None

    # Buscar match en categorías
    for categoria, config in CATEGORIAS.items():
        for keyword in config["keywords_include"]:
            if _normalizar(keyword) in tema_norm:
                print(f"[clasificar] {tema!r} → {categoria} (keyword: {keyword!r})")
                return categoria, config["probabilidad_default"]

    print(f"[clasificar] Sin categoría: {tema!r}")
    return None


# ── Paso 3: Generar poll con Gemini ──────────────────────────────────────────

def generar_poll_con_gemini(tema: str, categoria: str) -> dict | None:
    """
    Llama a Gemini Flash para generar título, descripción y probabilidad del poll.
    Retorna dict {titulo, descripcion, probabilidad} o None si falla.
    """
    if not GEMINI_API_KEY:
        print("[gemini] GEMINI_API_KEY no configurada")
        return None

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("ERROR: google-genai no está instalado. Ejecutá: pip install google-genai")
        sys.exit(1)

    client = genai.Client(api_key=GEMINI_API_KEY)

    schema = types.Schema(
        type=types.Type.OBJECT,
        required=["titulo", "descripcion", "probabilidad"],
        properties={
            "titulo": types.Schema(
                type=types.Type.STRING,
                description="Pregunta de sí/no, máximo 100 caracteres, clara y directa",
            ),
            "descripcion": types.Schema(
                type=types.Type.STRING,
                description="2-3 párrafos con contexto del tema, entre 200 y 400 caracteres",
            ),
            "probabilidad": types.Schema(
                type=types.Type.NUMBER,
                description="Estimación inicial de probabilidad de que ocurra, entre 10 y 90",
            ),
        },
    )

    prompt = f"""Sos un redactor de polls de predicción para una plataforma de mercados de predicción
enfocada en Argentina y América Latina. Tu audiencia son argentinos interesados en actualidad.

Dado el siguiente tema en tendencia en Argentina:
  Tema: "{tema}"
  Categoría: {categoria}

Generá un poll de predicción con:
- titulo: una pregunta de sí o no, máximo 100 caracteres, clara y específica.
  Debe ser predictiva (algo que aún no se sabe si va a ocurrir).
  Usá lenguaje coloquial argentino (vos, te, etc). No uses comillas en el título.
- descripcion: 2 o 3 párrafos cortos explicando el contexto del tema.
  Sin tecnicismos. Entre 200 y 400 caracteres en total.
- probabilidad: número entre 10 y 90 que represente la probabilidad estimada
  de que el evento del título ocurra. Sé realista según el contexto actual.

Respondé SOLO con el JSON, sin texto adicional."""

    for intento in range(2):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.8,
                ),
            )
            result = json.loads(response.text)

            # Validaciones básicas
            titulo = str(result.get("titulo", "")).strip()
            descripcion = str(result.get("descripcion", "")).strip()
            probabilidad = float(result.get("probabilidad", 50))

            if not titulo or not descripcion:
                raise ValueError("Gemini devolvió título o descripción vacíos")
            if len(titulo) > 120:
                titulo = titulo[:117] + "..."
            probabilidad = max(10.0, min(90.0, probabilidad))

            print(f"[gemini] Generado: {titulo!r} ({probabilidad}%)")
            return {"titulo": titulo, "descripcion": descripcion, "probabilidad": probabilidad}

        except Exception as e:
            print(f"[gemini] Intento {intento + 1} falló: {e}")
            if intento == 0:
                time.sleep(45)  # esperar rate limit window (60s / 5 req)

    return None


# ── Paso 4: Verificar duplicados ──────────────────────────────────────────────

def poll_ya_existe(titulo: str, token: str) -> bool:
    """
    Retorna True si ya existe un poll con título similar en la app.
    Usa las primeras 3 palabras del título como query de búsqueda.
    """
    palabras = titulo.split()[:3]
    query = " ".join(palabras)

    try:
        r = requests.get(
            f"{BACKEND_URL}/api/markets",
            params={"q": query},
            timeout=10,
        )
        if r.status_code != 200:
            return False

        mercados = r.json()
        if not isinstance(mercados, list):
            mercados = mercados.get("items", [])

        for m in mercados:
            titulo_existente = m.get("title", "")
            similitud = _similitud_levenshtein(titulo, titulo_existente)
            if similitud < 0.4:  # 60%+ de similitud → es duplicado
                print(f"[duplicado] Poll similar ya existe: {titulo_existente!r}")
                return True

    except Exception as e:
        print(f"[duplicado] Error al verificar: {e}")

    return False


# ── Paso 5: Crear poll via API ────────────────────────────────────────────────

def crear_poll(titulo: str, descripcion: str, probabilidad: float,
               categoria: str, token: str) -> str | None:
    """Crea el poll via POST /api/admin/markets. Retorna el ID o None si falla."""
    end_date = (datetime.now(timezone.utc) + timedelta(days=DIAS_DURACION_POLL))
    end_date_str = end_date.strftime("%Y-%m-%dT23:59:00Z")

    payload = {
        "title": titulo,
        "description": descripcion,
        "category": categoria,
        "type": "binary",
        "end_date": end_date_str,
        "probability": probabilidad,
    }

    try:
        r = requests.post(
            f"{BACKEND_URL}/api/admin/markets",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=15,
        )
        if r.status_code in (200, 201):
            poll_id = r.json().get("id")
            print(f"[crear] ✅ Poll creado: {poll_id} — {titulo!r}")
            return poll_id
        else:
            print(f"[crear] ❌ Error {r.status_code}: {r.text}")
            return None
    except Exception as e:
        print(f"[crear] ❌ Excepción: {e}")
        return None


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_admin_token() -> str:
    """Obtiene el JWT de admin via POST /api/auth/login."""
    r = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=15,
    )
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        raise ValueError("No se recibió access_token del backend")
    print(f"[auth] Token obtenido para {ADMIN_EMAIL}")
    return token


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print(f"  AUTO POLLS — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"  Backend: {BACKEND_URL}")
    print("=" * 60)

    # Auth
    try:
        token = get_admin_token()
    except Exception as e:
        print(f"[auth] ERROR: No se pudo autenticar: {e}")
        sys.exit(1)

    # Tendencias
    topics = get_trending_topics(geo="AR")
    if not topics:
        print("[main] No se obtuvieron trending topics. Saliendo.")
        sys.exit(0)

    # Procesar cada tema
    creados = 0
    descartados = 0
    errores = 0

    for tema in topics:
        if creados >= MAX_POLLS_POR_DIA:
            print(f"[main] Límite diario alcanzado ({MAX_POLLS_POR_DIA} polls). Parando.")
            break

        print(f"\n[main] Procesando: {tema!r}")

        # Clasificar
        clasificacion = clasificar_tema(tema)
        if clasificacion is None:
            descartados += 1
            continue
        categoria, prob_default = clasificacion

        # Generar con Gemini
        poll_data = generar_poll_con_gemini(tema, categoria)
        if poll_data is None:
            print(f"[main] Gemini no pudo generar poll para {tema!r}")
            errores += 1
            continue

        # Verificar duplicados
        if poll_ya_existe(poll_data["titulo"], token):
            descartados += 1
            continue

        # Crear poll
        poll_id = crear_poll(
            titulo=poll_data["titulo"],
            descripcion=poll_data["descripcion"],
            probabilidad=poll_data["probabilidad"],
            categoria=categoria,
            token=token,
        )

        if poll_id:
            creados += 1
        else:
            errores += 1

        time.sleep(15)  # free tier: 5 req/min → 1 req cada 15s

    print("\n" + "=" * 60)
    print(f"  RESUMEN: {creados} creados | {descartados} descartados | {errores} errores")
    print("=" * 60)

    if errores > 0 and creados == 0:
        sys.exit(1)  # falla el workflow si todo salió mal


if __name__ == "__main__":
    main()
