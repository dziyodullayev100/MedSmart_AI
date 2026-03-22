"""
MedSmart AI Service - Startup Script
Run this file to start the AI prediction service.
Usage: python run.py [--retrain]

Options:
  --retrain    Re-train all ML models before starting the service
  --host       Host to bind to (default: 0.0.0.0)
  --port       Port to listen on (default: 8000)
"""
from __future__ import annotations
import os
import sys
import argparse
import logging

# ── Ensure BASE_DIR is the ai_service folder ─────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# Add ai_service to sys.path so 'from training.X import ...' works
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("medsmart_runner")


def check_models_exist() -> bool:
    """Check if all required model .pkl files exist."""
    models_dir = os.path.join(BASE_DIR, "models")
    required = [
        "seasonal_model.pkl",
        "le_season.pkl",
        "le_prev.pkl",
        "le_disease.pkl",
        "progression_rules.pkl",
    ]
    missing = [f for f in required if not os.path.exists(os.path.join(models_dir, f))]
    if missing:
        logger.warning(f"Missing model files: {missing}")
        return False
    return True


def train_all_models() -> bool:
    """Import and run both training scripts."""
    logger.info("─── Training: Seasonal Disease Model ───────────────────")
    try:
        from training.seasonal_train import train_seasonal_model  # type: ignore
        train_seasonal_model()
    except Exception as e:
        logger.error(f"✗ Seasonal model training failed: {e}")
        return False

    logger.info("─── Training: Disease Progression Rules ─────────────────")
    try:
        from training.progression_train import train_progression_rules  # type: ignore
        train_progression_rules()
    except Exception as e:
        logger.error(f"✗ Progression training failed: {e}")
        return False

    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="MedSmart AI Healthcare Service")
    parser.add_argument("--retrain", action="store_true",
                        help="Force re-train all ML models before starting")
    parser.add_argument("--host", default="0.0.0.0",
                        help="Host to bind (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)),
                        help="Port to listen on (default: 8000 or $PORT)")
    args = parser.parse_args()

    logger.info("=" * 55)
    logger.info("  MedSmart AI Healthcare Service  v1.0.0")
    logger.info("=" * 55)

    # ── Train models if forced or any .pkl is missing ────────────────
    if args.retrain or not check_models_exist():
        logger.info("Starting model training pipeline...")
        if not train_all_models():
            logger.error("Training failed. Service cannot start.")
            sys.exit(1)
        logger.info("✓ All models trained successfully.")
    else:
        logger.info("✓ All model files present. Skipping training.")

    # ── Launch FastAPI ───────────────────────────────────────────────
    logger.info(f"Starting server on http://{args.host}:{args.port}")
    logger.info("  GET  /health")
    logger.info("  POST /ai/seasonal-prediction")
    logger.info("  POST /ai/disease-progression")
    logger.info(f"  Docs: http://localhost:{args.port}/docs")
    logger.info("=" * 55)

    import uvicorn  # type: ignore
    uvicorn.run("api:app", host=args.host, port=args.port,
                reload=False, log_level="info")


if __name__ == "__main__":
    main()
