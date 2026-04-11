"""Heatmap endpoint -- returns a grid of safety scores across Wandsworth.

Each (data_source, time_of_day) result is cached in memory after first
computation. Subsequent requests for the same time return instantly.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.community_report import CommunityReport
from app.schemas.heatmap import HeatmapPoint, HeatmapResponse
from app.services.scorer_selector import score_segment
from app.services.scoring_engine import set_community_reports

router = APIRouter(prefix="/api", tags=["heatmap"])

# Barnet (Hendon / Golders Green) bounding box, aligned with data files.
DEFAULT_BBOX = {
    "min_lat": 51.56,
    "max_lat": 51.60,
    "min_lng": -0.24,
    "max_lng": -0.17,
}
GRID_SPACING_M = 250  # ~250m between sample points

# Cache: (data_source, time_of_day) -> list of HeatmapPoint dicts
_heatmap_cache: dict[tuple[str, int], list[dict]] = {}


def _generate_grid(bbox: dict, spacing_m: int) -> list[tuple[float, float]]:
    """Generate a list of (lat, lng) points across the bounding box."""
    # Roughly: 1 degree latitude = 111km, 1 degree longitude varies with cos(lat)
    import math

    mid_lat = (bbox["min_lat"] + bbox["max_lat"]) / 2
    lat_step = spacing_m / 111000.0
    lng_step = spacing_m / (111000.0 * math.cos(math.radians(mid_lat)))

    points = []
    lat = bbox["min_lat"]
    while lat <= bbox["max_lat"]:
        lng = bbox["min_lng"]
        while lng <= bbox["max_lng"]:
            points.append((lat, lng))
            lng += lng_step
        lat += lat_step
    return points


def _refresh_reports_cache(db: Session) -> None:
    stmt = select(
        func.ST_Y(CommunityReport.location).label("lat"),
        func.ST_X(CommunityReport.location).label("lng"),
        CommunityReport.category,
    )
    rows = db.execute(stmt).all()
    set_community_reports([
        {"lat": row.lat, "lng": row.lng, "category": row.category}
        for row in rows
    ])


@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(time_of_day: int = 21, db: Session = Depends(get_db)):
    time_of_day = max(0, min(23, time_of_day))
    _refresh_reports_cache(db)

    cache_key = (settings.data_source, time_of_day)
    if cache_key in _heatmap_cache:
        return HeatmapResponse(
            points=[HeatmapPoint(**p) for p in _heatmap_cache[cache_key]],
            time_of_day=time_of_day,
            grid_spacing_m=GRID_SPACING_M,
        )

    grid = _generate_grid(DEFAULT_BBOX, GRID_SPACING_M)
    points: list[dict] = []
    for lat, lng in grid:
        result = score_segment(lat, lng, time_of_day)
        points.append({"lat": lat, "lng": lng, "score": result["safety_score"]})

    _heatmap_cache[cache_key] = points

    return HeatmapResponse(
        points=[HeatmapPoint(**p) for p in points],
        time_of_day=time_of_day,
        grid_spacing_m=GRID_SPACING_M,
    )
