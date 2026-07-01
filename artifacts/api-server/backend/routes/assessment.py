"""
Assessment routes: submit assessment, get history, get latest, get by ID,
and dashboard summary.
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from ml.predict import run_prediction

router = APIRouter(tags=["assessment"])


def _assessment_to_schema(assessment: models.Assessment) -> schemas.AssessmentResult:
    """Convert an ORM Assessment object to the response schema."""
    answers_dict = assessment.get_answers()
    fi_list = assessment.get_feature_importance()
    recs_list = assessment.get_recommendations()

    return schemas.AssessmentResult(
        id=assessment.id,
        user_id=assessment.user_id,
        created_at=assessment.created_at,
        answers=schemas.AssessmentInput(**answers_dict),
        prediction=schemas.PredictionResult(
            risk_level=assessment.risk_level,
            confidence=assessment.confidence,
            digital_wellbeing_score=assessment.digital_wellbeing_score,
            mood_score=assessment.mood_score,
            feature_importance=[schemas.FeatureImportance(**fi) for fi in fi_list],
            recommendations=recs_list,
        ),
    )


@router.post("/assessment", response_model=schemas.AssessmentResult, status_code=201)
def submit_assessment(
    payload: schemas.AssessmentInput,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a completed assessment, run ML prediction, and persist the result.
    """
    answers_dict = payload.model_dump()

    # Run the ML prediction
    prediction = run_prediction(answers_dict)

    # Persist to database
    assessment = models.Assessment(
        user_id=current_user.id,
        answers_json=json.dumps(answers_dict),
        risk_level=prediction["risk_level"],
        confidence=prediction["confidence"],
        digital_wellbeing_score=prediction["digital_wellbeing_score"],
        mood_score=prediction["mood_score"],
        feature_importance_json=json.dumps(prediction["feature_importance"]),
        recommendations_json=json.dumps(prediction["recommendations"]),
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return _assessment_to_schema(assessment)


@router.get("/assessment/history", response_model=List[schemas.AssessmentResult])
def get_assessment_history(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Return all assessments for the authenticated user, newest first."""
    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.user_id == current_user.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )
    return [_assessment_to_schema(a) for a in assessments]


@router.get("/assessment/latest", response_model=schemas.AssessmentResult)
def get_latest_assessment(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Return the most recent assessment for the authenticated user."""
    assessment = (
        db.query(models.Assessment)
        .filter(models.Assessment.user_id == current_user.id)
        .order_by(models.Assessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessments found. Take your first assessment to get started.",
        )
    return _assessment_to_schema(assessment)


@router.get("/assessment/{id}", response_model=schemas.AssessmentResult)
def get_assessment(
    id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Return a specific assessment by ID (only if it belongs to the user)."""
    assessment = (
        db.query(models.Assessment)
        .filter(models.Assessment.id == id, models.Assessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )
    return _assessment_to_schema(assessment)


@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return aggregated dashboard stats and trend data for the authenticated user.
    """
    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.user_id == current_user.id)
        .order_by(models.Assessment.created_at.asc())
        .all()
    )

    total = len(assessments)
    latest = assessments[-1] if assessments else None

    # Build trend arrays (date string → value)
    risk_map = {"Low": 1.0, "Moderate": 2.0, "High": 3.0}
    risk_trend = []
    mood_trend = []
    wellbeing_trend = []

    for a in assessments:
        date_str = a.created_at.strftime("%Y-%m-%d")
        risk_trend.append(schemas.TrendPoint(
            date=date_str,
            value=risk_map.get(a.risk_level, 1.0),
            label=a.risk_level,
        ))
        mood_trend.append(schemas.TrendPoint(
            date=date_str,
            value=round(a.mood_score, 1),
        ))
        wellbeing_trend.append(schemas.TrendPoint(
            date=date_str,
            value=round(a.digital_wellbeing_score, 1),
        ))

    return schemas.DashboardSummary(
        total_assessments=total,
        latest_risk_level=latest.risk_level if latest else None,
        latest_digital_wellbeing_score=round(latest.digital_wellbeing_score, 1) if latest else None,
        latest_mood_score=round(latest.mood_score, 1) if latest else None,
        risk_trend=risk_trend,
        mood_trend=mood_trend,
        wellbeing_trend=wellbeing_trend,
    )
