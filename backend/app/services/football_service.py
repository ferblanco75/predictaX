"""
Football Data Service — integrates with football-data.org API.
Caches responses in Redis with TTL based on match status.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
import redis

from app.config import settings
from app.core.database import SessionLocal
from app.models.football_fixture import FootballFixture

logger = logging.getLogger(__name__)

COMPETITION_CODE = "WC"
BASE_URL = "https://api.football-data.org/v4"

# Cache TTL seconds by match status
TTL_TIMED = 3600        # 1h — scheduled but not started
TTL_IN_PLAY = 60        # 1 min — live match
TTL_FINISHED = 86400    # 24h — completed
TTL_STANDINGS = 300     # 5 min during tournament
TTL_DEFAULT = 300

_redis: Optional[redis.Redis] = None


def _get_redis() -> Optional[redis.Redis]:
    global _redis
    if _redis is None:
        try:
            _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis.ping()
        except Exception as e:
            logger.warning(f"Redis not available for football cache: {e}")
            _redis = None
    return _redis


def _cache_get(key: str) -> Optional[dict]:
    r = _get_redis()
    if not r:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def _cache_set(key: str, data: dict, ttl: int) -> None:
    r = _get_redis()
    if not r:
        return
    try:
        r.setex(key, ttl, json.dumps(data, default=str))
    except Exception:
        pass


def _ttl_for_status(status: str) -> int:
    if status in ("IN_PLAY", "PAUSED", "HALFTIME"):
        return TTL_IN_PLAY
    if status in ("FINISHED", "AWARDED"):
        return TTL_FINISHED
    return TTL_TIMED


def _headers() -> dict:
    return {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}


def get_fixtures(season: int = 2026) -> Optional[list]:
    """Return all fixtures for the WC season. Cached per status."""
    cache_key = f"football:fixtures:{season}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    if not settings.FOOTBALL_DATA_API_KEY:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            res = client.get(
                f"{BASE_URL}/competitions/{COMPETITION_CODE}/matches",
                headers=_headers(),
                params={"season": season},
            )
            res.raise_for_status()
            data = res.json()
    except Exception as e:
        logger.warning(f"football-data.org fixtures fetch failed: {e}")
        return None

    matches = data.get("matches", [])
    normalized = [_normalize_match(m) for m in matches]

    # TTL based on whether any match is currently live
    any_live = any(m["status"] in ("IN_PLAY", "PAUSED") for m in normalized)
    ttl = TTL_IN_PLAY if any_live else TTL_TIMED
    _cache_set(cache_key, normalized, ttl)
    return normalized


def get_fixture(match_id: int) -> Optional[dict]:
    """Return a single fixture by ID. TTL depends on match status."""
    cache_key = f"football:fixture:{match_id}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    if not settings.FOOTBALL_DATA_API_KEY:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            res = client.get(
                f"{BASE_URL}/matches/{match_id}",
                headers=_headers(),
            )
            if res.status_code == 404:
                return None
            res.raise_for_status()
            data = res.json()
    except Exception as e:
        logger.warning(f"football-data.org fixture {match_id} fetch failed: {e}")
        return None

    normalized = _normalize_match(data)
    _cache_set(cache_key, normalized, _ttl_for_status(normalized["status"]))
    return normalized


def get_standings(season: int = 2026) -> Optional[list]:
    """Return group standings for the WC."""
    cache_key = f"football:standings:v2:{season}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    if not settings.FOOTBALL_DATA_API_KEY:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            res = client.get(
                f"{BASE_URL}/competitions/{COMPETITION_CODE}/standings",
                headers=_headers(),
                params={"season": season},
            )
            res.raise_for_status()
            data = res.json()
    except Exception as e:
        logger.warning(f"football-data.org standings fetch failed: {e}")
        return None

    standings = data.get("standings", [])
    # Keep only TOTAL type to avoid duplicates (HOME/AWAY variants)
    groups = [s for s in standings if s.get("type") == "TOTAL" and s.get("group")]

    if groups:
        normalized = [_normalize_standing(s) for s in groups]
    else:
        # Pre-tournament: standings API has no groups yet.
        # Build group tables from match data instead.
        normalized = _build_groups_from_fixtures(season)

    _cache_set(cache_key, normalized, TTL_STANDINGS)
    return normalized


def _build_groups_from_fixtures(season: int) -> list:
    """Build group standings from fixture data when the standings API has no groups yet."""
    try:
        with httpx.Client(timeout=10) as client:
            res = client.get(
                f"{BASE_URL}/competitions/{COMPETITION_CODE}/matches",
                headers=_headers(),
                params={"season": season},
            )
            res.raise_for_status()
            data = res.json()
    except Exception as e:
        logger.warning(f"football-data.org matches fetch for groups failed: {e}")
        return []

    groups: dict[str, dict] = {}
    for m in data.get("matches", []):
        group = m.get("group")
        if not group or m.get("stage") != "GROUP_STAGE":
            continue
        group_key = _normalize_group_key(group)
        if group_key not in groups:
            groups[group_key] = {}

        score = m.get("score", {})
        ft = score.get("fullTime", {})
        home_goals = ft.get("home")
        away_goals = ft.get("away")
        status = m.get("status", "TIMED")
        finished = status in ("FINISHED", "AWARDED")

        for side, opponent_side, goals_scored, goals_conceded in [
            ("homeTeam", "awayTeam", home_goals, away_goals),
            ("awayTeam", "homeTeam", away_goals, home_goals),
        ]:
            team = m.get(side, {})
            team_id = team.get("id")
            if not team_id:
                continue
            if team_id not in groups[group_key]:
                groups[group_key][team_id] = {
                    "team_id": team_id,
                    "team": team.get("name", ""),
                    "team_tla": team.get("tla", ""),
                    "team_crest": team.get("crest"),
                    "played": 0, "won": 0, "draw": 0, "lost": 0,
                    "goals_for": 0, "goals_against": 0, "goal_diff": 0, "points": 0,
                }
            entry = groups[group_key][team_id]
            if finished and goals_scored is not None and goals_conceded is not None:
                entry["played"] += 1
                entry["goals_for"] += goals_scored
                entry["goals_against"] += goals_conceded
                entry["goal_diff"] += goals_scored - goals_conceded
                if goals_scored > goals_conceded:
                    entry["won"] += 1
                    entry["points"] += 3
                elif goals_scored == goals_conceded:
                    entry["draw"] += 1
                    entry["points"] += 1
                else:
                    entry["lost"] += 1

    result = []
    for group_key in sorted(groups.keys()):
        table = sorted(
            groups[group_key].values(),
            key=lambda r: (-r["points"], -r["goal_diff"], -r["goals_for"], r["team"]),
        )
        for i, row in enumerate(table):
            row["position"] = i + 1
        result.append({
            "stage": "GROUP_STAGE",
            "group": group_key,
            "table": [
                {
                    "position": row["position"],
                    "team": row["team"],
                    "team_tla": row["team_tla"],
                    "team_crest": row["team_crest"],
                    "played": row["played"],
                    "won": row["won"],
                    "draw": row["draw"],
                    "lost": row["lost"],
                    "goals_for": row["goals_for"],
                    "goals_against": row["goals_against"],
                    "goal_diff": row["goal_diff"],
                    "points": row["points"],
                }
                for row in table
            ],
        })
    return result


def sync_fixtures_to_db(season: int = 2026) -> int:
    """Fetch all fixtures and upsert into football_fixtures table. Returns count synced."""
    fixtures = get_fixtures(season)
    if not fixtures:
        return 0

    db = SessionLocal()
    count = 0
    try:
        for f in fixtures:
            existing = db.query(FootballFixture).filter(FootballFixture.id == f["id"]).first()
            if existing:
                existing.status = f["status"]
                existing.home_score = f["score"]["home"]
                existing.away_score = f["score"]["away"]
                existing.winner = f["winner"]
                existing.venue = f.get("venue")
                existing.raw_data = f
                existing.last_synced_at = datetime.now(timezone.utc)
            else:
                db.add(FootballFixture(
                    id=f["id"],
                    competition_code=COMPETITION_CODE,
                    matchday=f.get("matchday"),
                    stage=f.get("stage"),
                    group=f.get("group"),
                    home_team=f["home_team"],
                    away_team=f["away_team"],
                    home_team_crest=f.get("home_team_crest"),
                    away_team_crest=f.get("away_team_crest"),
                    scheduled_at=datetime.fromisoformat(f["utc_date"].replace("Z", "+00:00")),
                    status=f["status"],
                    home_score=f["score"]["home"],
                    away_score=f["score"]["away"],
                    winner=f["winner"],
                    venue=f.get("venue"),
                    raw_data=f,
                ))
            count += 1
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"sync_fixtures_to_db failed: {e}")
        raise
    finally:
        db.close()
    return count


def _normalize_match(m: dict) -> dict:
    score = m.get("score", {})
    ft = score.get("fullTime", {})
    return {
        "id": m["id"],
        "utc_date": m.get("utcDate", ""),
        "status": m.get("status", "TIMED"),
        "matchday": m.get("matchday"),
        "stage": m.get("stage"),
        "group": m.get("group"),
        "home_team": m.get("homeTeam", {}).get("name", ""),
        "away_team": m.get("awayTeam", {}).get("name", ""),
        "home_team_tla": m.get("homeTeam", {}).get("tla", ""),
        "away_team_tla": m.get("awayTeam", {}).get("tla", ""),
        "home_team_crest": m.get("homeTeam", {}).get("crest"),
        "away_team_crest": m.get("awayTeam", {}).get("crest"),
        "score": {
            "home": ft.get("home"),
            "away": ft.get("away"),
        },
        "winner": score.get("winner"),
        "venue": m.get("venue"),
        "referees": [r.get("name") for r in m.get("referees", []) if r.get("name")],
    }


def _normalize_group_key(group: str | None) -> str | None:
    """Normalize group labels to GROUP_X format ('Group A' → 'GROUP_A')."""
    if not group:
        return group
    # Already in GROUP_X format
    if group.startswith("GROUP_"):
        return group
    # "Group A" → "GROUP_A"
    parts = group.strip().split()
    if len(parts) == 2 and parts[0].lower() == "group":
        return f"GROUP_{parts[1].upper()}"
    return group.upper().replace(" ", "_")


def _normalize_standing(s: dict) -> dict:
    return {
        "stage": s.get("stage"),
        "group": _normalize_group_key(s.get("group")),
        "table": [
            {
                "position": row.get("position"),
                "team": row.get("team", {}).get("name"),
                "team_tla": row.get("team", {}).get("tla"),
                "team_crest": row.get("team", {}).get("crest"),
                "played": row.get("playedGames"),
                "won": row.get("won"),
                "draw": row.get("draw"),
                "lost": row.get("lost"),
                "goals_for": row.get("goalsFor"),
                "goals_against": row.get("goalsAgainst"),
                "goal_diff": row.get("goalDifference"),
                "points": row.get("points"),
            }
            for row in s.get("table", [])
        ],
    }
