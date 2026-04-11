"""Train an XGBoost regressor to predict SafeWalk's safety score.

Uses knowledge distillation: samples random (lat, lng, hour) points across the
Barnet bounding box, runs them through the rule-based scorer to get synthetic
labels, then trains a gradient boosted model on the resulting (features, score)
pairs.

The trained model learns the rule patterns plus non-linear interactions, and
becomes a drop-in replacement for the rule-based scorer via the hot-swappable
`score_segment()` interface.

Run from the activated backend venv:
    python ../scripts/train_ml_scorer.py
"""

import argparse
import random
import sys
from pathlib import Path

# Make backend/ importable
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import joblib  # noqa: E402
import numpy as np  # noqa: E402
import xgboost as xgb  # noqa: E402
from sklearn.metrics import mean_absolute_error, r2_score  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402

from app.services.ml_features import (  # noqa: E402
    FEATURE_NAMES,
    extract_features,
    features_to_vector,
)
from app.services.scoring_engine import score_segment  # noqa: E402

DEFAULT_BBOX = {
    "min_lat": 51.56,
    "max_lat": 51.60,
    "min_lng": -0.24,
    "max_lng": -0.17,
}
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parent.parent
    / "backend" / "app" / "models_ml" / "safety_scorer.pkl"
)
DEFAULT_SAMPLES = 8000


def sample_points(n: int, bbox: dict, seed: int = 42) -> list[tuple[float, float, int]]:
    rng = random.Random(seed)
    return [
        (
            rng.uniform(bbox["min_lat"], bbox["max_lat"]),
            rng.uniform(bbox["min_lng"], bbox["max_lng"]),
            rng.randint(0, 23),
        )
        for _ in range(n)
    ]


def build_dataset(points: list[tuple[float, float, int]]) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) — features matrix and score labels."""
    X = np.zeros((len(points), len(FEATURE_NAMES)), dtype=float)
    y = np.zeros(len(points), dtype=float)

    for i, (lat, lng, hour) in enumerate(points):
        features = extract_features(lat, lng, hour)
        X[i] = features_to_vector(features)
        y[i] = score_segment(lat, lng, hour)["safety_score"]

    return X, y


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the SafeWalk ML scoring model.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--samples", type=int, default=DEFAULT_SAMPLES)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()

    print("=" * 60)
    print("TRAINING SAFEWALK ML SCORER")
    print("=" * 60)
    print(f"Samples:    {args.samples}")
    print(f"Test ratio: {args.test_size}")
    print(f"Output:     {args.output}")
    print(f"Seed:       {args.seed}")
    print()

    print("Sampling training points...")
    points = sample_points(args.samples, DEFAULT_BBOX, seed=args.seed)

    print("Extracting features and labels via knowledge distillation...")
    X, y = build_dataset(points)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed
    )
    print(f"  train: {len(X_train)}  test: {len(X_test)}")

    print("\nTraining XGBoost regressor...")
    model = xgb.XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:absoluteerror",
        tree_method="hist",
        random_state=args.seed,
    )
    model.fit(X_train, y_train)

    print("\nEvaluating...")
    pred_train = model.predict(X_train)
    pred_test = model.predict(X_test)

    train_mae = mean_absolute_error(y_train, pred_train)
    test_mae = mean_absolute_error(y_test, pred_test)
    train_r2 = r2_score(y_train, pred_train)
    test_r2 = r2_score(y_test, pred_test)

    print("=" * 60)
    print("METRICS")
    print("=" * 60)
    print(f"Train MAE:  {train_mae:.2f}")
    print(f"Test MAE:   {test_mae:.2f}")
    print(f"Train R²:   {train_r2:.4f}")
    print(f"Test R²:    {test_r2:.4f}")

    print("\nFeature importance (gain):")
    importances = model.feature_importances_
    ranked = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    for name, imp in ranked:
        bar = "█" * int(imp * 50)
        print(f"  {name:22s} {imp:.4f}  {bar}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, args.output)
    print(f"\nModel saved to {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
