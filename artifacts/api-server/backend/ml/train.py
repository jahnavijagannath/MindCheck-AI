"""
ML model training script for MindCheck AI.

Generates a synthetic dataset, trains Logistic Regression, Random Forest,
and XGBoost classifiers, compares them, and saves the best model.

Run this script once to produce the trained model artifacts.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier

# ─────────────────────────────────────────
# Paths
# ─────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ─────────────────────────────────────────
# Feature definitions (must match predict.py)
# ─────────────────────────────────────────

FEATURE_COLUMNS = [
    "social_media_hours",
    "sleep_quality",
    "stress_frequency",
    "social_comparison",
    "exercise_frequency",
    "mood",
]

FEATURE_LABELS = {
    "social_media_hours": "Social Media Usage",
    "sleep_quality": "Sleep Quality",
    "stress_frequency": "Stress Level",
    "social_comparison": "Social Comparison",
    "exercise_frequency": "Exercise Frequency",
    "mood": "Mood",
}

# Ordinal encodings (higher = worse for risk)
ENCODINGS = {
    "social_media_hours": {
        "Less than 2 Hours": 0,
        "2-4 Hours": 1,
        "4-6 Hours": 2,
        "More than 6 Hours": 3,
    },
    "sleep_quality": {
        "Very Good": 0,
        "Good": 1,
        "Average": 2,
        "Poor": 3,
    },
    "stress_frequency": {
        "Never": 0,
        "Sometimes": 1,
        "Often": 2,
        "Always": 3,
    },
    "social_comparison": {
        "Never": 0,
        "Rarely": 1,
        "Sometimes": 2,
        "Frequently": 3,
    },
    "exercise_frequency": {
        "Daily": 0,
        "3-5 Times Weekly": 1,
        "1-2 Times Weekly": 2,
        "Rarely": 3,
    },
    "mood": {
        "Happy": 0,
        "Calm": 1,
        "Neutral": 2,
        "Sad": 3,
    },
}

RISK_LABELS = {0: "Low", 1: "Moderate", 2: "High"}
RISK_VALUES = {"Low": 0, "Moderate": 1, "High": 2}


def generate_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generate a realistic synthetic dataset for mental health risk classification.
    Risk is determined by a weighted combination of all six features.
    """
    np.random.seed(42)
    rows = []

    for _ in range(n_samples):
        # Randomly sample each feature
        sm_hours = np.random.choice(list(ENCODINGS["social_media_hours"].keys()),
                                    p=[0.25, 0.30, 0.25, 0.20])
        sleep = np.random.choice(list(ENCODINGS["sleep_quality"].keys()),
                                 p=[0.20, 0.30, 0.30, 0.20])
        stress = np.random.choice(list(ENCODINGS["stress_frequency"].keys()),
                                  p=[0.15, 0.35, 0.30, 0.20])
        comparison = np.random.choice(list(ENCODINGS["social_comparison"].keys()),
                                      p=[0.20, 0.25, 0.30, 0.25])
        exercise = np.random.choice(list(ENCODINGS["exercise_frequency"].keys()),
                                    p=[0.15, 0.25, 0.35, 0.25])
        mood = np.random.choice(list(ENCODINGS["mood"].keys()),
                                p=[0.25, 0.20, 0.30, 0.25])

        # Compute a weighted risk score (0–3 scale, higher = worse)
        risk_score = (
            ENCODINGS["social_media_hours"][sm_hours] * 0.25 +
            ENCODINGS["sleep_quality"][sleep] * 0.25 +
            ENCODINGS["stress_frequency"][stress] * 0.20 +
            ENCODINGS["social_comparison"][comparison] * 0.10 +
            ENCODINGS["exercise_frequency"][exercise] * 0.10 +
            ENCODINGS["mood"][mood] * 0.10
        )

        # Add small Gaussian noise to prevent perfectly separable data
        risk_score += np.random.normal(0, 0.15)
        risk_score = np.clip(risk_score, 0, 3)

        # Threshold into three risk categories
        if risk_score < 1.0:
            risk = "Low"
        elif risk_score < 2.0:
            risk = "Moderate"
        else:
            risk = "High"

        rows.append({
            "social_media_hours": sm_hours,
            "sleep_quality": sleep,
            "stress_frequency": stress,
            "social_comparison": comparison,
            "exercise_frequency": exercise,
            "mood": mood,
            "risk": risk,
        })

    return pd.DataFrame(rows)


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    """Apply ordinal encoding to all feature columns."""
    encoded = df.copy()
    for col, mapping in ENCODINGS.items():
        if col in encoded.columns:
            encoded[col] = encoded[col].map(mapping)
    return encoded


def evaluate_model(name: str, model, X_test, y_test) -> dict:
    """Evaluate a trained model and return a metrics dictionary."""
    y_pred = model.predict(X_test)
    metrics = {
        "name": name,
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "f1": round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4),
    }
    print(f"  {name}: accuracy={metrics['accuracy']}, f1={metrics['f1']}")
    return metrics


def train_and_save():
    """
    Full training pipeline:
    1. Generate dataset
    2. Encode features
    3. Train three models
    4. Compare by F1 score
    5. Save the best model + encodings metadata
    """
    print("=== MindCheck AI — Model Training ===")

    # 1. Generate dataset
    print("\n[1/5] Generating synthetic dataset...")
    df = generate_dataset(n_samples=3000)
    print(f"  Dataset shape: {df.shape}")
    print(f"  Risk distribution:\n{df['risk'].value_counts()}")

    # 2. Encode
    print("\n[2/5] Encoding features...")
    df_enc = encode_features(df)
    X = df_enc[FEATURE_COLUMNS].values
    y = df_enc["risk"].map(RISK_VALUES).values

    # 3. Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Train models
    print("\n[3/5] Training models...")
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=150, random_state=42),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            verbosity=0,
        ),
    }

    # 5. Evaluate and pick best
    print("\n[4/5] Evaluating models...")
    results = []
    trained = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        metrics = evaluate_model(name, model, X_test, y_test)
        results.append(metrics)
        trained[name] = model

    best = max(results, key=lambda r: r["f1"])
    best_model = trained[best["name"]]
    print(f"\n  Best model: {best['name']} (F1={best['f1']})")

    # 6. Save artifacts
    print("\n[5/5] Saving model artifacts...")
    joblib.dump(best_model, os.path.join(MODELS_DIR, "best_model.pkl"))

    metadata = {
        "best_model_name": best["name"],
        "metrics": results,
        "encodings": ENCODINGS,
        "feature_columns": FEATURE_COLUMNS,
        "feature_labels": FEATURE_LABELS,
        "risk_labels": RISK_LABELS,
        "risk_values": RISK_VALUES,
    }
    with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    # Also save Random Forest for SHAP-based feature importance
    joblib.dump(trained["Random Forest"], os.path.join(MODELS_DIR, "random_forest.pkl"))

    print(f"  Saved to: {MODELS_DIR}")
    print("\n=== Training complete ===")
    return best_model, metadata


if __name__ == "__main__":
    train_and_save()
