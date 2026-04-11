"""Generate road-following sample routes by calling the Google Directions API.

Saves the response as sample_routes_london.json so the mock fallback uses
real polylines that follow actual streets, not straight lines.

Run from the activated backend venv:
    python scripts/generate_sample_routes.py

Or with uv run:
    uv run --with httpx --with polyline scripts/generate_sample_routes.py

Requires GOOGLE_MAPS_API_KEY in .env (or the environment).
"""

import argparse
import json
import os
import sys
from pathlib import Path

import httpx
import polyline as polyline_codec

DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parent.parent
    / "backend" / "app" / "data" / "sample_routes_london.json"
)
DEFAULT_ORIGIN = "Clapham Junction Station, London"
DEFAULT_DESTINATION = "Wandsworth Town Station, London"


def _load_api_key() -> str:
    """Pull API key from env or .env file in repo root."""
    key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if key:
        return key

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("GOOGLE_MAPS_API_KEY="):
                return line.split("=", 1)[1].strip()
    return ""


def _parse_route(route: dict) -> dict:
    """Flatten a Directions API route into our internal format."""
    leg = route["legs"][0]
    waypoints: list[dict] = []
    for step in leg["steps"]:
        decoded = polyline_codec.decode(step["polyline"]["points"])
        waypoints.extend({"lat": lat, "lng": lng} for lat, lng in decoded)

    return {
        "summary": route.get("summary", "walking route"),
        "distance_km": round(leg["distance"]["value"] / 1000, 2),
        "duration_min": round(leg["duration"]["value"] / 60),
        "waypoints": waypoints,
    }


def fetch_routes(origin: str, destination: str, api_key: str) -> list[dict]:
    params = {
        "origin": origin,
        "destination": destination,
        "mode": "walking",
        "alternatives": "true",
        "key": api_key,
    }
    response = httpx.get(DIRECTIONS_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    status = data.get("status")
    if status != "OK":
        raise RuntimeError(f"Directions API returned status={status}: {data.get('error_message', '')}")

    return [_parse_route(r) for r in data["routes"]]


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate road-following sample routes from the Google Directions API.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--origin", default=DEFAULT_ORIGIN)
    parser.add_argument("--destination", default=DEFAULT_DESTINATION)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    api_key = _load_api_key()

    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY not found in env or .env file", file=sys.stderr)
        return 1

    print("=" * 60)
    print("FETCHING REAL WALKING ROUTES")
    print("=" * 60)
    print(f"Origin:      {args.origin}")
    print(f"Destination: {args.destination}")
    print()

    try:
        routes = fetch_routes(args.origin, args.destination, api_key)
    except (httpx.HTTPError, RuntimeError) as err:
        print(f"ERROR: {err}", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(routes, f, indent=2)

    print(f"Saved {len(routes)} routes to {args.output}\n")
    for r in routes:
        print(f"  {r['summary']:40s}  {r['distance_km']}km  {r['duration_min']}min  {len(r['waypoints'])} points")

    return 0


if __name__ == "__main__":
    sys.exit(main())
