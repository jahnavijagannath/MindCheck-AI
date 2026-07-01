"""
SQLAlchemy ORM models for MindCheck AI.
Defines Users, Assessments tables with relationships.
"""

import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """Stores registered user accounts."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    occupation = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # One user can have many assessments
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")


class Assessment(Base):
    """
    Stores each mental health assessment and its ML prediction result.
    Answers and prediction are serialized as JSON strings for SQLite compatibility.
    """
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # The 6 assessment answers stored as JSON
    answers_json = Column(Text, nullable=False)

    # ML prediction results stored as JSON
    risk_level = Column(String(20), nullable=False)       # Low / Moderate / High
    confidence = Column(Float, nullable=False)
    digital_wellbeing_score = Column(Float, nullable=False)
    mood_score = Column(Float, nullable=False)
    feature_importance_json = Column(Text, nullable=False)  # [{feature, importance, label}]
    recommendations_json = Column(Text, nullable=False)    # [string]

    # Relationship back to user
    user = relationship("User", back_populates="assessments")

    def get_answers(self) -> dict:
        """Deserialize assessment answers from JSON."""
        return json.loads(self.answers_json)

    def get_feature_importance(self) -> list:
        """Deserialize feature importance list from JSON."""
        return json.loads(self.feature_importance_json)

    def get_recommendations(self) -> list:
        """Deserialize recommendations list from JSON."""
        return json.loads(self.recommendations_json)
