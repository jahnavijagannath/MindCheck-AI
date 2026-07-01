"""
Prediction route: POST /predict
Runs ML inference without persisting to the database.
Useful for previewing results before saving.
"""

from fastapi import APIRouter, Depends
import models
import schemas
import auth as auth_utils
from ml.predict import run_prediction

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=schemas.PredictionResult)
def predict(
    payload: schemas.AssessmentInput,
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """
    Run ML prediction on the provided assessment answers.
    Does NOT save the assessment — use POST /assessment to persist.
    """
    answers_dict = payload.model_dump()
    result = run_prediction(answers_dict)

    return schemas.PredictionResult(
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        digital_wellbeing_score=result["digital_wellbeing_score"],
        mood_score=result["mood_score"],
        feature_importance=[
            schemas.FeatureImportance(**fi) for fi in result["feature_importance"]
        ],
        recommendations=result["recommendations"],
    )
