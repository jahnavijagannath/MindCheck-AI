"""
ML prediction module for MindCheck AI.

Loads the trained model and generates:
- Risk level (Low / Moderate / High)
- Confidence score
- Digital Wellbeing Score (0-100)
- Mood Score (0-100)
- Feature importance (top 3 drivers using SHAP or model importances)
- Personalized recommendations
"""

import os
import json
import numpy as np
import joblib

# ─────────────────────────────────────────
# Paths
# ─────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "trained_models")

# ─────────────────────────────────────────
# Feature encodings (must match train.py)
# ─────────────────────────────────────────

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

RISK_LABELS = {0: "Low", 1: "Moderate", 2: "High"}

# ─────────────────────────────────────────
# Lazy-loaded model singleton
# ─────────────────────────────────────────

_model = None
_rf_model = None


def _load_model():
    """Load the best model from disk (lazy, cached after first call)."""
    global _model, _rf_model
    if _model is None:
        model_path = os.path.join(MODELS_DIR, "best_model.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "Trained model not found. Please run ml/train.py first."
            )
        _model = joblib.load(model_path)

    rf_path = os.path.join(MODELS_DIR, "random_forest.pkl")
    if _rf_model is None and os.path.exists(rf_path):
        _rf_model = joblib.load(rf_path)

    return _model, _rf_model


# ─────────────────────────────────────────
# Recommendation engine
# ─────────────────────────────────────────

RECOMMENDATIONS = {
    "social_media_hours": {
        2: "Consider setting a daily social media time limit of 2 hours.",
        3: "High screen time detected. Take regular device-free breaks throughout the day.",
    },
    "sleep_quality": {
        2: "Try maintaining a consistent sleep schedule to improve sleep quality.",
        3: "Poor sleep quality significantly impacts mental health. Consider a relaxing bedtime routine.",
    },
    "stress_frequency": {
        2: "Practice mindfulness or deep breathing exercises to manage frequent stress.",
        3: "High stress levels detected. Consider speaking with a mental health professional.",
    },
    "social_comparison": {
        2: "Remind yourself that social media shows highlights, not reality.",
        3: "Frequent social comparison can harm self-esteem. Try a social media detox for a week.",
    },
    "exercise_frequency": {
        2: "Aim for at least 30 minutes of exercise three times a week.",
        3: "Regular physical activity is a powerful mood booster. Start with short daily walks.",
    },
    "mood": {
        2: "Engage in activities that bring you joy to lift your mood.",
        3: "Consistently low mood may benefit from professional support. You are not alone.",
    },
}

GENERAL_RECOMMENDATIONS = [
    "Connect with friends or family regularly — social support is vital for mental health.",
    "Spend at least 20 minutes outdoors each day to improve your wellbeing.",
    "Limit news and social media consumption before bedtime.",
    "Practice gratitude journaling — write down three positive things each day.",
    "Stay hydrated and maintain a balanced diet for optimal brain function.",
]


def _get_recommendations(encoded_values: list) -> list:
    """
    Generate personalized recommendations based on encoded feature values.
    Returns 3-5 actionable recommendations.
    """
    recs = []
    for i, feature in enumerate(FEATURE_COLUMNS):
        val = encoded_values[i]
        if feature in RECOMMENDATIONS:
            if val in RECOMMENDATIONS[feature]:
                recs.append(RECOMMENDATIONS[feature][val])

    # Add general recommendations to fill out to at least 4 total
    for rec in GENERAL_RECOMMENDATIONS:
        if len(recs) >= 5:
            break
        if rec not in recs:
            recs.append(rec)

    return recs[:5]


# ─────────────────────────────────────────
# Feature importance via SHAP (or fallback)
# ─────────────────────────────────────────

def _get_feature_importance(rf_model, X: np.ndarray) -> list:
    """
    Compute per-feature importance scores using SHAP values if possible,
    falling back to model-level importances for the given sample.

    Returns a list of {feature, importance, label} dicts sorted descending.
    """
    importances = []

    try:
        import shap
        explainer = shap.TreeExplainer(rf_model)
        shap_values = explainer.shap_values(X)

        # For multi-class, shap_values is a list of arrays; sum absolute values
        if isinstance(shap_values, list):
            abs_vals = np.abs(np.array(shap_values)).mean(axis=0)[0]
        else:
            abs_vals = np.abs(shap_values)[0]

        for i, feature in enumerate(FEATURE_COLUMNS):
            importances.append({
                "feature": feature,
                "importance": round(float(abs_vals[i]), 4),
                "label": FEATURE_LABELS[feature],
            })
    except Exception:
        # Fallback: use Random Forest built-in feature importances
        if rf_model is not None and hasattr(rf_model, "feature_importances_"):
            fi = rf_model.feature_importances_
        else:
            # Last resort: uniform importances
            fi = np.ones(len(FEATURE_COLUMNS)) / len(FEATURE_COLUMNS)

        for i, feature in enumerate(FEATURE_COLUMNS):
            importances.append({
                "feature": feature,
                "importance": round(float(fi[i]), 4),
                "label": FEATURE_LABELS[feature],
            })

    # Sort descending by importance
    return sorted(importances, key=lambda x: x["importance"], reverse=True)


# ─────────────────────────────────────────
# Score computation
# ─────────────────────────────────────────

def _compute_digital_wellbeing_score(encoded_values: list) -> float:
    """
    Compute a Digital Wellbeing Score (0-100, higher = healthier).
    Weighted combination of social media usage and exercise.
    """
    sm = encoded_values[FEATURE_COLUMNS.index("social_media_hours")]
    exercise = encoded_values[FEATURE_COLUMNS.index("exercise_frequency")]
    stress = encoded_values[FEATURE_COLUMNS.index("stress_frequency")]
    sleep = encoded_values[FEATURE_COLUMNS.index("sleep_quality")]

    # Invert so 0 = worst, 3 = best (all features: higher encoded = worse)
    sm_score = (3 - sm) / 3
    exercise_score = (3 - exercise) / 3
    stress_score = (3 - stress) / 3
    sleep_score = (3 - sleep) / 3

    wellbeing = (sm_score * 0.35 + exercise_score * 0.25 + stress_score * 0.20 + sleep_score * 0.20)
    return round(wellbeing * 100, 1)


def _compute_mood_score(encoded_values: list) -> float:
    """
    Compute a Mood Score (0-100, higher = better mood).
    Primarily driven by mood and social comparison answers.
    """
    mood = encoded_values[FEATURE_COLUMNS.index("mood")]
    comparison = encoded_values[FEATURE_COLUMNS.index("social_comparison")]
    sleep = encoded_values[FEATURE_COLUMNS.index("sleep_quality")]

    mood_score = (3 - mood) / 3
    comparison_score = (3 - comparison) / 3
    sleep_score = (3 - sleep) / 3

    score = (mood_score * 0.50 + comparison_score * 0.25 + sleep_score * 0.25)
    return round(score * 100, 1)


# ─────────────────────────────────────────
# Public prediction function
# ─────────────────────────────────────────

def run_prediction(answers: dict) -> dict:
    """
    Main entry point: takes a dict of raw assessment answers,
    returns a full prediction result dict.

    Args:
        answers: dict with keys matching FEATURE_COLUMNS

    Returns:
        dict with risk_level, confidence, digital_wellbeing_score,
        mood_score, feature_importance, recommendations
    """
    # Ensure model is loaded
    model, rf_model = _load_model()

    # Encode the input
    encoded = []
    for feature in FEATURE_COLUMNS:
        value = answers.get(feature, "")
        encoded_val = ENCODINGS[feature].get(value, 0)
        encoded.append(encoded_val)

    X = np.array([encoded])

    # Predict class and probability
    pred_class = int(model.predict(X)[0])
    risk_level = RISK_LABELS[pred_class]

    # Confidence: probability of predicted class
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0]
        confidence = round(float(proba[pred_class]), 4)
    else:
        confidence = 0.80  # fallback for models without predict_proba

    # Compute derived scores
    digital_wellbeing_score = _compute_digital_wellbeing_score(encoded)
    mood_score = _compute_mood_score(encoded)

    # Feature importance (SHAP or fallback)
    feature_importance = _get_feature_importance(rf_model or model, X)

    # Personalized recommendations
    recommendations = _get_recommendations(encoded)

    return {
        "risk_level": risk_level,
        "confidence": confidence,
        "digital_wellbeing_score": digital_wellbeing_score,
        "mood_score": mood_score,
        "feature_importance": feature_importance,
        "recommendations": recommendations,
    }
