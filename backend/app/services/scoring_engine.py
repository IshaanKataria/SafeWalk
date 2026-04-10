"""Mock safety scoring engine.

Scores a geographic point for pedestrian safety based on nearby crime,
street lighting density, and time of day. Returns 0-100 where higher = safer.

This module defines the stable interface that Callum's ML model will replace.
The only function that matters externally is score_segment().
"""

from app.services.data_loader import get_nearby_crimes, get_nearby_lights

# --- Tunable weights ---
BASE_SCORE = 75
CRIME_RADIUS_KM = 0.3
LIGHTING_RADIUS_KM = 0.2
CRIME_WEIGHT_PER_SEVERITY = 2.0  # penalty per severity point
MAX_CRIME_PENALTY = 45
LIGHTING_BONUS_PER_LIGHT = 3.0
MAX_LIGHTING_BONUS = 25
# Night multiplier: how much more lighting/crime matter after dark
NIGHT_LIGHTING_MULTIPLIER = 2.0
NIGHT_CRIME_MULTIPLIER = 1.5


def _time_modifier(hour: int) -> float:
    """Baseline modifier based on time of day.

    Daylight (7-17): +10 bonus
    Dusk/dawn (5-7, 17-19): 0
    Night (19-23): -5 to -15 penalty (gets worse later)
    Late night (0-5): -15 penalty
    """
    if 7 <= hour <= 17:
        return 10.0
    if 5 <= hour < 7 or 17 < hour <= 19:
        return 0.0
    if 19 < hour <= 23:
        return -5.0 - (hour - 19) * 2.5
    # 0-4
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

    # Crime factor
    nearby_crimes = get_nearby_crimes(lat, lng, CRIME_RADIUS_KM)
    total_severity = sum(c["severity"] for c in nearby_crimes)
    crime_multiplier = NIGHT_CRIME_MULTIPLIER if dark else 1.0
    crime_penalty = min(total_severity * CRIME_WEIGHT_PER_SEVERITY * crime_multiplier, MAX_CRIME_PENALTY)

    # Lighting factor
    nearby_lights = get_nearby_lights(lat, lng, LIGHTING_RADIUS_KM)
    light_count = len(nearby_lights)
    lighting_multiplier = NIGHT_LIGHTING_MULTIPLIER if dark else 1.0
    lighting_bonus = min(light_count * LIGHTING_BONUS_PER_LIGHT * lighting_multiplier, MAX_LIGHTING_BONUS)

    # Time factor
    time_mod = _time_modifier(hour)

    # Final score
    raw = BASE_SCORE - crime_penalty + lighting_bonus + time_mod
    safety_score = max(0, min(100, round(raw)))

    return {
        "safety_score": safety_score,
        "factors": {
            "crime_count": len(nearby_crimes),
            "crime_severity_total": total_severity,
            "crime_penalty": round(crime_penalty, 1),
            "light_count": light_count,
            "lighting_bonus": round(lighting_bonus, 1),
            "time_modifier": time_mod,
            "is_dark": dark,
        },
    }
