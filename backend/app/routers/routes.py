from fastapi import APIRouter

from app.schemas.route import RouteRequest, RouteResponse, ScoredRoute, ScoredSegment, LatLng
from app.services.google_maps import get_routes
from app.services.route_scorer import score_route

router = APIRouter(prefix="/api", tags=["routes"])


@router.post("/routes", response_model=RouteResponse)
def get_scored_routes(request: RouteRequest):
    raw_routes = get_routes(request.origin, request.destination)

    scored_routes = []
    for raw in raw_routes:
        result = score_route(raw["waypoints"], request.time_of_day)

        segments = [
            ScoredSegment(
                start=LatLng(**seg["start"]),
                end=LatLng(**seg["end"]),
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

    # Safest route first
    scored_routes.sort(key=lambda r: r.overall_score, reverse=True)

    return RouteResponse(routes=scored_routes)
