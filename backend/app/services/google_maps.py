"""Google Maps Directions API wrapper with mock fallback.

When USE_MOCK_DATA is true or the API key is missing, returns pre-computed
routes from sample_routes.json so the app works without any external calls.
"""

import json
import logging
from pathlib import Path

import httpx
import polyline as polyline_codec

from app.config import settings

logger = logging.getLogger(__name__)

_APP_DIR = Path(__file__).resolve().parent.parent
_LONDON_ROUTES_PATH = _APP_DIR / "data" / "sample_routes_london.json"
_CLAYTON_ROUTES_PATH = _APP_DIR / "mock_data" / "sample_routes.json"
_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"


def _load_mock_routes() -> list[dict]:
    path = _LONDON_ROUTES_PATH if settings.data_source == "london" else _CLAYTON_ROUTES_PATH
    with open(path) as f:
        return json.load(f)


def _parse_google_route(route: dict) -> dict:
    """Extract waypoints, distance, and duration from a Google Directions route."""
    leg = route["legs"][0]
    waypoints = []
    for step in leg["steps"]:
        decoded = polyline_codec.decode(step["polyline"]["points"])
        waypoints.extend({"lat": lat, "lng": lng} for lat, lng in decoded)

    return {
        "summary": route.get("summary", ""),
        "distance_km": round(leg["distance"]["value"] / 1000, 1),
        "duration_min": round(leg["duration"]["value"] / 60),
        "waypoints": waypoints,
    }


def get_routes(origin: str, destination: str) -> list[dict]:
    """Fetch walking routes between two locations.

    Returns list of route dicts, each with:
        summary, distance_km, duration_min, waypoints: [{lat, lng}]
    """
    if settings.use_mock_data or not settings.google_maps_api_key:
        logger.info("Using mock route data")
        return _load_mock_routes()

    try:
        response = httpx.get(
            _DIRECTIONS_URL,
            params={
                "origin": origin,
                "destination": destination,
                "mode": "walking",
                "alternatives": "true",
                "key": settings.google_maps_api_key,
            },
            timeout=10,
        )
        data = response.json()

        if data.get("status") != "OK":
            logger.warning("Directions API returned %s, falling back to mock", data.get("status"))
            return _load_mock_routes()

        return [_parse_google_route(r) for r in data["routes"]]

    except Exception:
        logger.exception("Directions API call failed, falling back to mock")
        return _load_mock_routes()
