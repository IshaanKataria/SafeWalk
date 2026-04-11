"""Feature extraction for the ML scoring engine.

Must be the single source of truth — imported by both training (which generates
the .pkl) and inference (which loads the .pkl and scores live requests).
"""

import math

from app.services.data_loader import (
    get_nearby_crimes,
    get_nearby_lights,
    get_nearby_transport,
)

# These radii match the rule-based scorer for consistency in distillation.
CRIME_RADIUS_KM = 0.3
LIGHTING_RADIUS_KM = 0.2
TRANSPORT_RADIUS_KM = 0.25

# Feature column order — must stay stable across training and inference.
FEATURE_NAMES = [
    "crime_count",
    "crime_severity_total",
    "light_count",
    "transport_count",
    "hour",
    "hour_sin",
    "hour_cos",
    "is_dark",
]


def extract_features(lat: float, lng: float, time_of_day: int) -> dict:
    """Compute a feature dict for a single (lat, lng, time) sample.

    Returns a dict keyed by FEATURE_NAMES. Callers turn this into a vector
    via `features_to_vector()`.
    """
    hour = max(0, min(23, time_of_day))
    is_dark = 1 if (hour >= 19 or hour < 6) else 0

    crimes = get_nearby_crimes(lat, lng, CRIME_RADIUS_KM)
    lights = get_nearby_lights(lat, lng, LIGHTING_RADIUS_KM)
    transport = get_nearby_transport(lat, lng, TRANSPORT_RADIUS_KM)

    return {
        "crime_count": len(crimes),
        "crime_severity_total": sum(c.get("severity", 0) for c in crimes),
        "light_count": len(lights),
        "transport_count": len(transport),
        "hour": hour,
        # Encode hour as (sin, cos) so the model sees 23:00 and 00:00 as adjacent.
        "hour_sin": math.sin(2 * math.pi * hour / 24),
        "hour_cos": math.cos(2 * math.pi * hour / 24),
        "is_dark": is_dark,
    }


def features_to_vector(features: dict) -> list[float]:
    """Convert a features dict into the ordered vector the model expects."""
    return [float(features[name]) for name in FEATURE_NAMES]
