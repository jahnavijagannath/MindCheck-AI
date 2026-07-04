"""
MindCheck AI — FastAPI Application Entry Point

Configures the FastAPI app, CORS, route registration,
database initialization, and ML model startup.
"""

import os
import sys
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes.auth import router as auth_router
from routes.assessment import router as assessment_router
from routes.prediction import router as prediction_router
from routes.report import router as report_router
from routes.admin import router as admin_router

# ─────────────────────────────────────────
# Logging
# ─────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mindcheck")

# ─────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────

app = FastAPI(
    title="MindCheck AI API",
    description="Mental Health Risk & Mood Pattern Analysis API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Database initialization
# ─────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    """
    On startup:
    1. Create all database tables
    2. Create the default admin account if it doesn't exist
    3. Ensure the ML model is trained and ready
    """
    logger.info("Starting MindCheck AI API...")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready.")

    # Create default admin account
    _seed_admin()

    # Ensure ML model exists
    _ensure_model()

    logger.info("MindCheck AI API is ready.")


def _seed_admin():
    """Create the default admin user if one doesn't exist yet."""
    from sqlalchemy.orm import Session
    from database import SessionLocal
    import models
    from auth import hash_password

    db: Session = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.is_admin == True).first()
        if not admin:
            admin = models.User(
                full_name="Admin",
                email="admin@mindcheck.ai",
                hashed_password=hash_password("admin123"),
                age=30,
                gender="Prefer not to say",
                occupation="System Administrator",
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin account created: admin@mindcheck.ai / admin123")
    finally:
        db.close()


def _ensure_model():
    """Train the ML model if it hasn't been trained yet."""
    import os
    models_dir = os.path.join(os.path.dirname(__file__), "trained_models")
    model_path = os.path.join(models_dir, "best_model.pkl")

    if not os.path.exists(model_path):
        logger.info("Trained model not found. Training now (this may take 10-30 seconds)...")
        try:
            from ml.train import train_and_save
            train_and_save()
            logger.info("ML model trained and saved successfully.")
        except Exception as e:
            logger.error(f"Failed to train model: {e}")
    else:
        logger.info("Trained ML model found.")


# ─────────────────────────────────────────
# Route registration (all under /api prefix)
# ─────────────────────────────────────────

app.include_router(auth_router, prefix="/api")
app.include_router(assessment_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(report_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


# ─────────────────────────────────────────
# Health check
# ─────────────────────────────────────────

@app.get("/api/healthz")
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}


# ─────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Starting uvicorn on port {port}...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
@app.get("/")
def root():
    return {
        "message": "MindCheck AI Backend is Running!"
    }