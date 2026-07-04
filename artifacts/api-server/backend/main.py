"""
MindCheck AI — FastAPI Application Entry Point
"""

import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes.auth import router as auth_router
from routes.assessment import router as assessment_router
from routes.prediction import router as prediction_router
from routes.report import router as report_router
from routes.admin import router as admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mindcheck")

app = FastAPI(
    title="MindCheck AI API",
    description="Mental Health Risk & Mood Pattern Analysis API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    logger.info("Starting MindCheck AI API...")

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready.")

    _seed_admin()
    _ensure_model()

    logger.info("MindCheck AI API is ready.")


def _seed_admin():
    from sqlalchemy.orm import Session
    from database import SessionLocal
    import models
    from auth import hash_password

    db: Session = SessionLocal()

    try:
        admin = db.query(models.User).filter(
            models.User.is_admin == True
        ).first()

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
            logger.info("Default admin account created.")
    finally:
        db.close()


def _ensure_model():
    models_dir = os.path.join(
        os.path.dirname(__file__),
        "trained_models",
    )

    model_path = os.path.join(
        models_dir,
        "best_model.pkl",
    )

    if not os.path.exists(model_path):
        logger.info("Training ML model...")
        from ml.train import train_and_save
        train_and_save()
    else:
        logger.info("Trained ML model found.")


# ---------------- ROOT ----------------

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "MindCheck AI Backend is Running!",
        "docs": "/api/docs",
        "health": "/api/healthz"
    }


@app.get("/api/healthz")
def health():
    return {
        "status": "ok"
    }


# ---------------- ROUTERS ----------------

app.include_router(auth_router, prefix="/api")
app.include_router(assessment_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(report_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )