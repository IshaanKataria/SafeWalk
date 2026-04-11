"""Select the active scoring engine based on the SCORING_ENGINE env var.

Both engines export a `score_segment(lat, lng, time_of_day) -> dict` function
with identical signatures, so any consumer can just import from here and never
care which backend is active.
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)

if settings.scoring_engine == "ml":
    try:
        from app.services.ml_scoring_engine import score_segment  # noqa: F401
        logger.info("Scoring engine: ml (XGBoost)")
    except FileNotFoundError:
        logger.warning("ML model not found, falling back to rule-based scorer")
        from app.services.scoring_engine import score_segment  # noqa: F401
else:
    from app.services.scoring_engine import score_segment  # noqa: F401
    logger.info("Scoring engine: mock (rule-based)")
