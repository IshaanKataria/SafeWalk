"""Loads crime, lighting, and transport data from disk.

The dataset is selected via the DATA_SOURCE env var:
  - "london" -> real Wandsworth data in app/data/ (default)
  - "mock"   -> synthetic Clayton data in app/mock_data/
"""

import json
import math
from pathlib import Path

from app.config import settings

_APP_DIR = Path(__file__).resolve().parent.parent
_REAL_DIR = _APP_DIR / "data"
_MOCK_DIR = _APP_DIR / "mock_data"

_FILES: dict[str, dict[str, str]] = {
    "london": {
        "crime": "crime_data_london.json",
        "lighting": "lighting_data_london.json",
        "transport": "transport_data_london.json",
    },
    "mock": {
        "crime": "crime_data.json",
        "lighting": "lighting_data.json",
        # mock Clayton dataset has no transport file
        "transport": "",
    },
}

_crime_cache: list[dict] | None = None
_lighting_cache: list[dict] | None = None
_transport_cache: list[dict] | None = None


def _source_dir() -> Path:
    return _REAL_DIR if settings.data_source == "london" else _MOCK_DIR


def _load(key: str) -> list[dict]:
    filename = _FILES.get(settings.data_source, _FILES["mock"])[key]
    if not filename:
        return []
    path = _source_dir() / filename
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)


def _get_crimes() -> list[dict]:
    global _crime_cache
    if _crime_cache is None:
        _crime_cache = _load("crime")
    return _crime_cache


def _get_lights() -> list[dict]:
    global _lighting_cache
    if _lighting_cache is None:
        _lighting_cache = _load("lighting")
    return _lighting_cache


def _get_transport() -> list[dict]:
    global _transport_cache
    if _transport_cache is None:
        _transport_cache = _load("transport")
    return _transport_cache


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_nearby_crimes(lat: float, lng: float, radius_km: float = 0.5) -> list[dict]:
    return [
        c for c in _get_crimes()
        if haversine_km(lat, lng, c["lat"], c["lng"]) <= radius_km
    ]


def get_nearby_lights(lat: float, lng: float, radius_km: float = 0.2) -> list[dict]:
    return [
        l for l in _get_lights()
        if haversine_km(lat, lng, l["lat"], l["lng"]) <= radius_km
    ]


def get_nearby_transport(lat: float, lng: float, radius_km: float = 0.3) -> list[dict]:
    return [
        t for t in _get_transport()
        if haversine_km(lat, lng, t["lat"], t["lng"]) <= radius_km
    ]
