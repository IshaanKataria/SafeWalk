from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.community_report import CommunityReport
from app.schemas.route import LatLng, RouteRequest, RouteResponse, ScoredRoute, ScoredSegment
from app.services.google_maps import get_routes
from app.services.route_scorer import score_route
from app.services.scoring_engine import set_community_reports

router = APIRouter(prefix="/api", tags=["routes"])


def _refresh_reports_cache(db: Session) -> None:
    """Pull all community reports into the scoring engine's in-memory cache."""
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


@router.post("/routes", response_model=RouteResponse)
def get_scored_routes(request: RouteRequest, db: Session = Depends(get_db)):
    _refresh_reports_cache(db)

    raw_routes = get_routes(request.origin, request.destination)

    scored_routes = []
    for raw in raw_routes:
        result = score_route(raw["waypoints"], request.time_of_day)

        segments = [
            ScoredSegment(
                path=[LatLng(**p) for p in seg["path"]],
                safety_score=seg["safety_score"],
                color=seg["color"],
            )
            for seg in result["segments"]
        ]

        scored_routes.append(ScoredRoute(
            summary=raw["summary"],
            distance_km=raw["distance_km"],
            duration_min=raw["duration_min"],
            overall_score=result["overall_score"],
            segments=segments,
        ))

    scored_routes.sort(key=lambda r: r.overall_score, reverse=True)
    return RouteResponse(routes=scored_routes)
