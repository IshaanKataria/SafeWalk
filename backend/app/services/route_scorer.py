"""Scores an entire route by sampling points along the polyline.

Splits the route into segments, scores each one via the scoring engine,
classifies colours, and computes an overall route safety score.

Each segment preserves ALL the original polyline points between its
boundaries so the frontend can render smooth road-following curves.
"""

from app.services.data_loader import haversine_km
from app.services.scorer_selector import score_segment

SAMPLE_INTERVAL_KM = 0.1  # score every ~100m


def _classify_colour(score: int) -> str:
    if score >= 71:
        return "green"
    if score >= 41:
        return "yellow"
    return "red"


def _sample_waypoints(waypoints: list[dict], interval_km: float) -> list[int]:
    """Return indices of waypoints to use as segment boundaries.

    Always includes first and last. Picks intermediate points
    that are roughly `interval_km` apart along the path.
    """
    if len(waypoints) <= 2:
        return list(range(len(waypoints)))

    indices = [0]
    accumulated = 0.0

    for i in range(1, len(waypoints)):
        prev = waypoints[i - 1]
        curr = waypoints[i]
        accumulated += haversine_km(prev["lat"], prev["lng"], curr["lat"], curr["lng"])

        if accumulated >= interval_km:
            indices.append(i)
            accumulated = 0.0

    if indices[-1] != len(waypoints) - 1:
        indices.append(len(waypoints) - 1)

    return indices


def score_route(waypoints: list[dict], time_of_day: int) -> dict:
    """Score a full route and return segments with colours.

    Args:
        waypoints: list of {lat, lng} dicts from the route
        time_of_day: hour 0-23

    Returns:
        {
            "segments": [
                {
                    "path": [{lat, lng}, ...],   # all points in this segment
                    "safety_score": int,
                    "color": "green" | "yellow" | "red"
                }
            ],
            "overall_score": int
        }
    """
    indices = _sample_waypoints(waypoints, SAMPLE_INTERVAL_KM)

    segments = []
    score_sum = 0

    for i in range(len(indices) - 1):
        start_idx = indices[i]
        end_idx = indices[i + 1]

        # Preserve every polyline point inside this segment so the
        # rendered line follows the real road curvature.
        path = waypoints[start_idx : end_idx + 1]

        # Score at the midpoint of the segment's straight-line span.
        start = path[0]
        end = path[-1]
        mid_lat = (start["lat"] + end["lat"]) / 2
        mid_lng = (start["lng"] + end["lng"]) / 2
        result = score_segment(mid_lat, mid_lng, time_of_day)
        safety = result["safety_score"]

        segments.append({
            "path": path,
            "safety_score": safety,
            "color": _classify_colour(safety),
        })
        score_sum += safety

    overall = round(score_sum / len(segments)) if segments else 0

    return {
        "segments": segments,
        "overall_score": overall,
    }
