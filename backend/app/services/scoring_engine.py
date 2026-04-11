"""Safety scoring engine.

Scores a geographic point for pedestrian safety based on nearby crime,
street lighting density, public transport, and time of day.
Returns 0-100 where higher = safer.

This module defines the stable interface that the ML model will replace.
The only function that matters externally is score_segment().
"""

import math

from app.services.data_loader import (
    get_nearby_crimes,
    get_nearby_lights,
    get_nearby_transport,
    haversine_km,
)

# --- Community reports cache ---
# Populated by the routes endpoint before scoring so the engine can apply
# user-reported safety flags. Keeps the engine side-effect free from the DB.
_report_cache: list[dict] = []


def set_community_reports(reports: list[dict]) -> None:
    """Refresh the in-memory cache of community reports (lat, lng, category)."""
    global _report_cache
    _report_cache = reports


def _nearby_reports(lat: float, lng: float, radius_km: float) -> list[dict]:
    return [
        r for r in _report_cache
        if haversine_km(lat, lng, r["lat"], r["lng"]) <= radius_km
    ]


# --- Tunable weights ---
BASE_SCORE = 85

CRIME_RADIUS_KM = 0.3
LIGHTING_RADIUS_KM = 0.2
TRANSPORT_RADIUS_KM = 0.25

# Crime: square-root of total severity. sqrt compresses the long tail so dense
# urban areas don't all max out.
CRIME_SEVERITY_SQRT_WEIGHT = 1.6
MAX_CRIME_PENALTY = 50

# Lighting: rare in OSM (not every lamp is tagged), so each one is worth a lot.
LIGHTING_BONUS_PER_LIGHT = 5.0
MAX_LIGHTING_BONUS = 20

# Transport: sqrt-scaled. More bus stops and stations = busier = safer.
TRANSPORT_SQRT_WEIGHT = 3.0
MAX_TRANSPORT_BONUS = 20

# Community reports: each user-flagged report nearby applies a penalty.
REPORT_RADIUS_KM = 0.3
REPORT_PENALTY_PER_REPORT = 6.0
MAX_REPORT_PENALTY = 25

# Night multipliers — lighting and crime matter more after dark.
NIGHT_LIGHTING_MULTIPLIER = 2.0
NIGHT_CRIME_MULTIPLIER = 1.3


def _time_modifier(hour: int) -> float:
    """Baseline modifier based on time of day.

    Daylight (7-17):          +10 bonus
    Dusk/dawn (5-7, 17-19):     0
    Night (19-23):             -5 to -15 penalty (progressively worse)
    Late night (0-5):          -15 penalty
    """
    if 7 <= hour <= 17:
        return 10.0
    if 5 <= hour < 7 or 17 < hour <= 19:
        return 0.0
    if 19 < hour <= 23:
        return -5.0 - (hour - 19) * 2.5
    return -15.0


def _is_dark(hour: int) -> bool:
    return hour >= 19 or hour < 6


def score_segment(lat: float, lng: float, time_of_day: int) -> dict:
    """Score a single geographic point for safety.

    Args:
        lat: Latitude
        lng: Longitude
        time_of_day: Hour of day (0-23)

    Returns:
        {"safety_score": int 0-100, "factors": dict with breakdown}
    """
    hour = max(0, min(23, time_of_day))
    dark = _is_dark(hour)

    # --- Crime ---
    nearby_crimes = get_nearby_crimes(lat, lng, CRIME_RADIUS_KM)
    total_severity = sum(c["severity"] for c in nearby_crimes)
    crime_multiplier = NIGHT_CRIME_MULTIPLIER if dark else 1.0
    crime_penalty = min(
        math.sqrt(total_severity) * CRIME_SEVERITY_SQRT_WEIGHT * crime_multiplier,
        MAX_CRIME_PENALTY,
    )

    # --- Lighting ---
    nearby_lights = get_nearby_lights(lat, lng, LIGHTING_RADIUS_KM)
    light_count = len(nearby_lights)
    lighting_multiplier = NIGHT_LIGHTING_MULTIPLIER if dark else 1.0
    lighting_bonus = min(
        light_count * LIGHTING_BONUS_PER_LIGHT * lighting_multiplier,
        MAX_LIGHTING_BONUS,
    )

    # --- Transport (proxy for busy/active areas) ---
    nearby_transport = get_nearby_transport(lat, lng, TRANSPORT_RADIUS_KM)
    transport_count = len(nearby_transport)
    transport_bonus = min(
        math.sqrt(transport_count) * TRANSPORT_SQRT_WEIGHT,
        MAX_TRANSPORT_BONUS,
    )

    # --- Community reports ---
    nearby_reports = _nearby_reports(lat, lng, REPORT_RADIUS_KM)
    report_count = len(nearby_reports)
    report_penalty = min(report_count * REPORT_PENALTY_PER_REPORT, MAX_REPORT_PENALTY)

    # --- Time ---
    time_mod = _time_modifier(hour)

    # --- Final ---
    raw = (
        BASE_SCORE
        - crime_penalty
        + lighting_bonus
        + transport_bonus
        - report_penalty
        + time_mod
    )
    safety_score = max(0, min(100, round(raw)))

    return {
        "safety_score": safety_score,
        "factors": {
            "crime_count": len(nearby_crimes),
            "crime_severity_total": total_severity,
            "crime_penalty": round(crime_penalty, 1),
            "light_count": light_count,
            "lighting_bonus": round(lighting_bonus, 1),
            "transport_count": transport_count,
            "transport_bonus": round(transport_bonus, 1),
            "report_count": report_count,
            "report_penalty": round(report_penalty, 1),
            "time_modifier": time_mod,
            "is_dark": dark,
        },
    }
