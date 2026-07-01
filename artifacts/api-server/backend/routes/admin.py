"""
Admin routes: login, stats, users, assessments, CSV export.
All routes (except admin login) require admin privileges.
"""

import csv
import io
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(tags=["admin"])


@router.post("/admin/login", response_model=schemas.AuthResponse)
def admin_login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Admin-specific login. Returns 401 if the user is not an admin."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not auth_utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account does not have admin privileges.",
        )

    token = auth_utils.create_access_token({"sub": str(user.id)})
    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user),
    )


@router.get("/admin/stats", response_model=schemas.AdminStats)
def get_admin_stats(
    current_admin: models.User = Depends(auth_utils.get_current_admin),
    db: Session = Depends(get_db),
):
    """Return aggregate statistics for the admin dashboard."""
    total_users = db.query(func.count(models.User.id)).scalar()
    total_assessments = db.query(func.count(models.Assessment.id)).scalar()

    # Average risk score (Low=1, Moderate=2, High=3)
    risk_map = {"Low": 1.0, "Moderate": 2.0, "High": 3.0}
    all_risk_levels = db.query(models.Assessment.risk_level).all()
    if all_risk_levels:
        avg_risk = sum(risk_map.get(r[0], 1.0) for r in all_risk_levels) / len(all_risk_levels)
    else:
        avg_risk = 0.0

    # Risk distribution counts
    dist = {level: 0 for level in ["Low", "Moderate", "High"]}
    for (level,) in all_risk_levels:
        if level in dist:
            dist[level] += 1

    # Recent users (last 10)
    recent_users = (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .limit(10)
        .all()
    )

    # Recent assessments with joined user info (last 10)
    recent_raw = (
        db.query(models.Assessment, models.User)
        .join(models.User, models.Assessment.user_id == models.User.id)
        .order_by(models.Assessment.created_at.desc())
        .limit(10)
        .all()
    )
    recent_assessments = [
        schemas.AdminAssessmentRow(
            id=a.id,
            user_id=a.user_id,
            user_name=u.full_name,
            user_email=u.email,
            risk_level=a.risk_level,
            digital_wellbeing_score=a.digital_wellbeing_score,
            mood_score=a.mood_score,
            created_at=a.created_at,
        )
        for a, u in recent_raw
    ]

    return schemas.AdminStats(
        total_users=total_users,
        total_assessments=total_assessments,
        avg_risk_score=round(avg_risk, 2),
        risk_distribution=schemas.RiskDistribution(**dist),
        recent_users=[schemas.UserOut.model_validate(u) for u in recent_users],
        recent_assessments=recent_assessments,
    )


@router.get("/admin/users", response_model=List[schemas.UserOut])
def get_admin_users(
    current_admin: models.User = Depends(auth_utils.get_current_admin),
    db: Session = Depends(get_db),
):
    """Return all registered users ordered by creation date."""
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [schemas.UserOut.model_validate(u) for u in users]


@router.get("/admin/assessments", response_model=List[schemas.AdminAssessmentRow])
def get_admin_assessments(
    current_admin: models.User = Depends(auth_utils.get_current_admin),
    db: Session = Depends(get_db),
):
    """Return all assessments with user details, newest first."""
    rows = (
        db.query(models.Assessment, models.User)
        .join(models.User, models.Assessment.user_id == models.User.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )
    return [
        schemas.AdminAssessmentRow(
            id=a.id,
            user_id=a.user_id,
            user_name=u.full_name,
            user_email=u.email,
            risk_level=a.risk_level,
            digital_wellbeing_score=a.digital_wellbeing_score,
            mood_score=a.mood_score,
            created_at=a.created_at,
        )
        for a, u in rows
    ]


@router.get("/admin/export-csv")
def export_csv(
    current_admin: models.User = Depends(auth_utils.get_current_admin),
    db: Session = Depends(get_db),
):
    """Export all assessments as a downloadable CSV file."""
    rows = (
        db.query(models.Assessment, models.User)
        .join(models.User, models.Assessment.user_id == models.User.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV header
    writer.writerow([
        "Assessment ID", "User ID", "Full Name", "Email", "Age", "Gender", "Occupation",
        "Social Media Hours", "Sleep Quality", "Stress Frequency", "Social Comparison",
        "Exercise Frequency", "Mood", "Risk Level", "Confidence",
        "Digital Wellbeing Score", "Mood Score", "Created At",
    ])

    for assessment, user in rows:
        answers = assessment.get_answers()
        writer.writerow([
            assessment.id,
            user.id,
            user.full_name,
            user.email,
            user.age,
            user.gender,
            user.occupation,
            answers.get("social_media_hours", ""),
            answers.get("sleep_quality", ""),
            answers.get("stress_frequency", ""),
            answers.get("social_comparison", ""),
            answers.get("exercise_frequency", ""),
            answers.get("mood", ""),
            assessment.risk_level,
            round(assessment.confidence * 100, 1),
            round(assessment.digital_wellbeing_score, 1),
            round(assessment.mood_score, 1),
            assessment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=mindcheck_assessments.csv",
        },
    )
