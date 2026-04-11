"""Download real data for Wandsworth, London.

Fetches three datasets into backend/app/data/:
  - crime_data_london.json       (data.police.uk)
  - lighting_data_london.json    (OpenStreetMap Overpass API)
  - transport_data_london.json   (OpenStreetMap Overpass API)

Run from any directory:
    uv run --with httpx scripts/download_london_data.py

Or from the activated backend venv (httpx already installed):
    python scripts/download_london_data.py
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Wandsworth, London bounding box (fixed unless overridden via CLI)
# ---------------------------------------------------------------------------
DEFAULT_BBOX = {
    "min_lat": 51.43,
    "max_lat": 51.47,
    "min_lng": -0.22,
    "max_lng": -0.15,
}

# Map UK Police crime categories to 1-5 severity
SEVERITY_MAP = {
    "violent-crime": 5,
    "robbery": 5,
    "possession-of-weapons": 4,
    "burglary": 4,
    "theft-from-the-person": 4,
    "criminal-damage-arson": 3,
    "vehicle-crime": 3,
    "other-theft": 3,
    "drugs": 2,
    "public-order": 2,
    "bicycle-theft": 2,
    "shoplifting": 2,
    "other-crime": 2,
    "anti-social-behaviour": 1,
}

POLICE_URL = "https://data.police.uk/api/crimes-street/all-crime"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "backend" / "app" / "data"


def _bbox_poly(bbox: dict) -> str:
    """Format bbox as a poly string the police API accepts."""
    return (
        f"{bbox['min_lat']},{bbox['min_lng']}:"
        f"{bbox['min_lat']},{bbox['max_lng']}:"
        f"{bbox['max_lat']},{bbox['max_lng']}:"
        f"{bbox['max_lat']},{bbox['min_lng']}"
    )


def _recent_months(count: int) -> list[str]:
    """Return the last `count` months as YYYY-MM strings.

    Police API data lags ~2 months. Start from 2 months back.
    """
    now = datetime.now()
    year, month = now.year, now.month
    months = []
    for i in range(2, 2 + count):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        months.append(f"{y:04d}-{m:02d}")
    return months


def download_crime_data(bbox: dict, months_back: int = 6) -> list[dict]:
    print(f"[crime] fetching {months_back} months from data.police.uk")
    poly = _bbox_poly(bbox)
    months = _recent_months(months_back)

    all_crimes: list[dict] = []

    with httpx.Client(timeout=30) as client:
        for month in months:
            try:
                response = client.get(POLICE_URL, params={"poly": poly, "date": month})
                if response.status_code != 200:
                    print(f"  {month}: HTTP {response.status_code}, skipping")
                    continue

                raw = response.json()
                for item in raw:
                    loc = item.get("location") or {}
                    category = item.get("category", "other-crime")
                    try:
                        lat = float(loc["latitude"])
                        lng = float(loc["longitude"])
                    except (KeyError, TypeError, ValueError):
                        continue

                    all_crimes.append({
                        "lat": lat,
                        "lng": lng,
                        "crime_type": category,
                        "month": item.get("month", month),
                        "severity": SEVERITY_MAP.get(category, 2),
                    })
                print(f"  {month}: {len(raw)} crimes")
                time.sleep(0.1)  # be nice to the API
            except httpx.HTTPError as err:
                print(f"  {month}: error - {err}")

    return all_crimes


def _run_overpass(query: str, label: str) -> list[dict]:
    print(f"[{label}] querying Overpass API")
    try:
        with httpx.Client(timeout=90) as client:
            response = client.post(OVERPASS_URL, data={"data": query})
        if response.status_code != 200:
            print(f"  HTTP {response.status_code}")
            return []
        return response.json().get("elements", [])
    except httpx.HTTPError as err:
        print(f"  error - {err}")
        return []


def download_lighting_data(bbox: dict) -> list[dict]:
    query = (
        "[out:json][timeout:60];"
        f'node["highway"="street_lamp"]'
        f'({bbox["min_lat"]},{bbox["min_lng"]},{bbox["max_lat"]},{bbox["max_lng"]});'
        "out;"
    )
    elements = _run_overpass(query, "lighting")
    return [
        {"lat": el["lat"], "lng": el["lon"]}
        for el in elements
        if "lat" in el and "lon" in el
    ]


def download_transport_data(bbox: dict) -> list[dict]:
    b = (bbox["min_lat"], bbox["min_lng"], bbox["max_lat"], bbox["max_lng"])
    query = (
        "[out:json][timeout:60];("
        f'node["public_transport"="stop_position"]{b};'
        f'node["highway"="bus_stop"]{b};'
        f'node["railway"="station"]{b};'
        f'node["railway"="subway_entrance"]{b};'
        ");out;"
    )
    elements = _run_overpass(query, "transport")

    result = []
    for el in elements:
        if "lat" not in el or "lon" not in el:
            continue
        tags = el.get("tags", {})
        if tags.get("railway") == "station":
            t_type = "train"
        elif tags.get("railway") == "subway_entrance" or tags.get("station") == "subway":
            t_type = "tube"
        elif tags.get("highway") == "bus_stop" or tags.get("bus") == "yes":
            t_type = "bus"
        else:
            t_type = "other"
        result.append({"lat": el["lat"], "lng": el["lon"], "type": t_type})

    return result


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download real Wandsworth (London) data for SafeWalk.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--months", type=int, default=6, help="Months of crime data")
    parser.add_argument("--min-lat", type=float, default=DEFAULT_BBOX["min_lat"])
    parser.add_argument("--max-lat", type=float, default=DEFAULT_BBOX["max_lat"])
    parser.add_argument("--min-lng", type=float, default=DEFAULT_BBOX["min_lng"])
    parser.add_argument("--max-lng", type=float, default=DEFAULT_BBOX["max_lng"])
    return parser.parse_args()


def main() -> int:
    args = _parse_args()

    bbox = {
        "min_lat": args.min_lat,
        "max_lat": args.max_lat,
        "min_lng": args.min_lng,
        "max_lng": args.max_lng,
    }
    output_dir: Path = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("DOWNLOADING LONDON DATA")
    print("=" * 60)
    print(f"Bounding box: {bbox}")
    print(f"Output dir:   {output_dir}")
    print()

    crimes = download_crime_data(bbox, months_back=args.months)
    with open(output_dir / "crime_data_london.json", "w") as f:
        json.dump(crimes, f)
    print(f"[crime] saved {len(crimes)} records\n")

    lights = download_lighting_data(bbox)
    with open(output_dir / "lighting_data_london.json", "w") as f:
        json.dump(lights, f)
    print(f"[lighting] saved {len(lights)} records\n")

    transport = download_transport_data(bbox)
    with open(output_dir / "transport_data_london.json", "w") as f:
        json.dump(transport, f)
    print(f"[transport] saved {len(transport)} records\n")

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Crime incidents:  {len(crimes):>6}")
    print(f"Street lights:    {len(lights):>6}")
    print(f"Transport stops:  {len(transport):>6}")
    print(f"Bounding box:     {bbox}")
    print(f"Output directory: {output_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
