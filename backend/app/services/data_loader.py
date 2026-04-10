import json
import math
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent.parent / "mock_data"

_crime_cache: list[dict] | None = None
_lighting_cache: list[dict] | None = None


def _load_json(filename: str) -> list[dict]:
    with open(_DATA_DIR / filename) as f:
        return json.load(f)


def _get_crimes() -> list[dict]:
    global _crime_cache
    if _crime_cache is None:
        _crime_cache = _load_json("crime_data.json")
    return _crime_cache


def _get_lights() -> list[dict]:
    global _lighting_cache
    if _lighting_cache is None:
        _lighting_cache = _load_json("lighting_data.json")
    return _lighting_cache


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
