"""
Report route: GET /report/{id}
Generates and returns a PDF report for a completed assessment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from reports.generator import generate_pdf_report

router = APIRouter(tags=["report"])


@router.get("/report/{id}")
def download_report(
    id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate and return a PDF report for the given assessment ID.
    The assessment must belong to the authenticated user.
    """
    assessment = (
        db.query(models.Assessment)
        .filter(
            models.Assessment.id == id,
            models.Assessment.user_id == current_user.id,
        )
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found.",
        )

    # Build structured dicts for the PDF generator
    user_dict = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "age": current_user.age,
        "gender": current_user.gender,
        "occupation": current_user.occupation,
    }
    assessment_dict = {
        "id": assessment.id,
        "created_at": assessment.created_at,
        "answers": assessment.get_answers(),
    }
    prediction_dict = {
        "risk_level": assessment.risk_level,
        "confidence": assessment.confidence,
        "digital_wellbeing_score": assessment.digital_wellbeing_score,
        "mood_score": assessment.mood_score,
        "feature_importance": assessment.get_feature_importance(),
        "recommendations": assessment.get_recommendations(),
    }

    pdf_bytes = generate_pdf_report(user_dict, assessment_dict, prediction_dict)

    filename = f"mindcheck_report_{assessment.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
