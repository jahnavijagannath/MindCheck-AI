"""
Pydantic schemas for request/response validation.
These mirror the OpenAPI spec contracts.
"""

from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field


# ─────────────────────────────────────────
# Auth schemas
# ─────────────────────────────────────────

class UserRegistration(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    age: int = Field(..., ge=10, le=120)
    gender: str
    occupation: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    age: int
    gender: str
    occupation: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─────────────────────────────────────────
# Assessment schemas
# ─────────────────────────────────────────

class AssessmentInput(BaseModel):
    social_media_hours: str
    sleep_quality: str
    stress_frequency: str
    social_comparison: str
    exercise_frequency: str
    mood: str


class FeatureImportance(BaseModel):
    feature: str
    importance: float
    label: str


class PredictionResult(BaseModel):
    risk_level: str
    confidence: float
    digital_wellbeing_score: float
    mood_score: float
    feature_importance: List[FeatureImportance]
    recommendations: List[str]


class AssessmentResult(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    answers: AssessmentInput
    prediction: PredictionResult

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Dashboard schemas
# ─────────────────────────────────────────

class TrendPoint(BaseModel):
    date: str
    value: float
    label: Optional[str] = None


class DashboardSummary(BaseModel):
    total_assessments: int
    latest_risk_level: Optional[str] = None
    latest_digital_wellbeing_score: Optional[float] = None
    latest_mood_score: Optional[float] = None
    risk_trend: List[TrendPoint]
    mood_trend: List[TrendPoint]
    wellbeing_trend: List[TrendPoint]


# ─────────────────────────────────────────
# Admin schemas
# ─────────────────────────────────────────

class RiskDistribution(BaseModel):
    Low: int
    Moderate: int
    High: int


class AdminAssessmentRow(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    risk_level: str
    digital_wellbeing_score: float
    mood_score: float
    created_at: datetime


class AdminStats(BaseModel):
    total_users: int
    total_assessments: int
    avg_risk_score: float
    risk_distribution: RiskDistribution
    recent_users: List[UserOut]
    recent_assessments: List[AdminAssessmentRow]


# ─────────────────────────────────────────
# Health
# ─────────────────────────────────────────

class HealthStatus(BaseModel):
    status: str
