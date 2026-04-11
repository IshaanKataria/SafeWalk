"""ML-backed scoring engine.

Drop-in replacement for services.scoring_engine with the exact same
`score_segment` signature. Loads a pre-trained XGBoost regressor from disk
on first import and uses it for predictions.

To train the model, run:
    python scripts/train_ml_scorer.py

To activate this engine, set SCORING_ENGINE=ml in .env.
"""

import logging
from pathlib import Path

import joblib
import numpy as np

from app.services.ml_features import (
    FEATURE_NAMES,
    extract_features,
    features_to_vector,
)
from app.services.scoring_engine import set_community_reports  # noqa: F401  (re-exported for router)

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent.parent / "models_ml" / "safety_scorer.pkl"

_model = None


def _load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"ML model not found at {MODEL_PATH}. "
                "Train it first: python scripts/train_ml_scorer.py"
            )
        _model = joblib.load(MODEL_PATH)
        logger.info("Loaded ML safety scorer from %s", MODEL_PATH)
    return _model


def score_segment(lat: float, lng: float, time_of_day: int) -> dict:
    """Predict a safety score using the trained XGBoost model.

    Same signature and return shape as the rule-based scorer so callers
    don't need to care which engine is active.
    """
    model = _load_model()

    features = extract_features(lat, lng, time_of_day)
    vector = np.array([features_to_vector(features)])
    raw_prediction = float(model.predict(vector)[0])
    safety_score = max(0, min(100, round(raw_prediction)))

    return {
        "safety_score": safety_score,
        "factors": {
            **{name: features[name] for name in FEATURE_NAMES},
            "model": "xgboost",
            "raw_prediction": round(raw_prediction, 2),
        },
    }
