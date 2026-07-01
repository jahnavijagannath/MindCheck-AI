"""
Authentication routes: register, login, get profile, update profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=schemas.AuthResponse, status_code=201)
def register(payload: schemas.UserRegistration, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Create user record
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=auth_utils.hash_password(payload.password),
        age=payload.age,
        gender=payload.gender,
        occupation=payload.occupation,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue JWT
    token = auth_utils.create_access_token({"sub": str(user.id)})

    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user),
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate an existing user and return a JWT."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not auth_utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = auth_utils.create_access_token({"sub": str(user.id)})

    return schemas.AuthResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user),
    )


@router.get("/profile", response_model=schemas.UserOut)
def get_profile(current_user: models.User = Depends(auth_utils.get_current_user)):
    """Return the authenticated user's profile."""
    return schemas.UserOut.model_validate(current_user)


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated user's profile fields."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.age is not None:
        current_user.age = payload.age
    if payload.gender is not None:
        current_user.gender = payload.gender
    if payload.occupation is not None:
        current_user.occupation = payload.occupation

    db.commit()
    db.refresh(current_user)
    return schemas.UserOut.model_validate(current_user)
