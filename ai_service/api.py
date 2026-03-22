from __future__ import annotations
import os
import logging
from typing import Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medsmart_ai")

from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
import joblib  # type: ignore
import numpy as np  # type: ignore

# ─── Ensure working directory is the ai_service folder ────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedSmart AI Healthcare API",
    description="AI-powered seasonal disease prediction and disease progression analysis for MedSmart Medical System",
    version="1.0.0"
)

# Allow requests from Node.js backend and any local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Input Schemas ────────────────────────────────────────────────────────────

class SeasonalPredictionRequest(BaseModel):
    """Request body for seasonal disease prediction."""
    patient_id: Any
    age: int
    month: int
    season: str
    previous_diseases: list[str] = []
    chronic_conditions: list[str] = []

class DiagnosisEntry(BaseModel):
    """A single diagnosis entry from the patient's history."""
    disease: Optional[str] = None
    severity: Optional[str] = None
    symptoms: Optional[Any] = None
    date: Optional[str] = None
    status: Optional[str] = None
    doctor: Optional[str] = None

class VitalsData(BaseModel):
    """Latest patient vital signs."""
    bloodPressure: Optional[str] = None
    heartRate: Optional[int] = None
    temperature: Optional[float] = None
    oxygenSaturation: Optional[float] = None
    weight: Optional[float] = None
    recordedAt: Optional[str] = None

class DiseaseProgressionRequest(BaseModel):
    """Request body for disease progression analysis."""
    patient_id: Any
    history: list[DiagnosisEntry] = []
    vitals: Optional[VitalsData] = None
    chronic_conditions: list[str] = []

# ─── Model Loading ────────────────────────────────────────────────────────────

def load_models():
    """Load all pre-trained ML models from the models/ directory."""
    models_dir = os.path.join(BASE_DIR, "models")
    try:
        seasonal_model = joblib.load(os.path.join(models_dir, "seasonal_model.pkl"))
        le_season = joblib.load(os.path.join(models_dir, "le_season.pkl"))
        le_prev = joblib.load(os.path.join(models_dir, "le_prev.pkl"))
        le_disease = joblib.load(os.path.join(models_dir, "le_disease.pkl"))
        progression_rules = joblib.load(os.path.join(models_dir, "progression_rules.pkl"))
        logger.info("✓ All AI models loaded successfully.")
        return seasonal_model, le_season, le_prev, le_disease, progression_rules
    except FileNotFoundError as e:
        logger.error(f"Model file not found: {e}. Run training scripts first.")
        return None, None, None, None, None
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        return None, None, None, None, None

seasonal_model, le_season, le_prev, le_disease, progression_rules = load_models()

# ─── Helper: Assess vitals risk ───────────────────────────────────────────────

def assess_vitals_risk(vitals: Optional[VitalsData]) -> list[str]:
    """Return a list of risk flags based on vital signs thresholds."""
    if vitals is None:
        return []
    
    risks = []
    
    # Blood pressure check (e.g., "130/85")
    bp = vitals.bloodPressure
    if bp is not None:
        try:
            parts = str(bp).split("/")
            systolic = int(parts[0])
            diastolic = int(parts[1])
            if systolic >= 140 or diastolic >= 90:
                risks.append("Hypertension risk (high BP)")
            elif systolic >= 130 or diastolic >= 80:
                risks.append("Elevated blood pressure")
        except Exception:
            pass

    # Heart rate check
    hr = vitals.heartRate
    if hr is not None:
        if hr > 100:
            risks.append("Tachycardia (high heart rate)")
        elif hr < 60:
            risks.append("Bradycardia (low heart rate)")

    # Temperature check
    temp = vitals.temperature
    if temp is not None:
        if temp >= 38.0:
            risks.append("Fever detected")
        elif temp < 36.0:
            risks.append("Hypothermia risk")

    # Oxygen saturation check
    oxy = vitals.oxygenSaturation
    if oxy is not None:
        if oxy < 95.0:
            risks.append("Low oxygen saturation - respiratory concern")

    return risks

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint - confirms service is running and models are loaded."""
    models_loaded = seasonal_model is not None and progression_rules is not None
    return {
        "status": "healthy" if models_loaded else "degraded",
        "service": "MedSmart AI Healthcare API",
        "version": "1.0.0",
        "models_loaded": models_loaded,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/ai/seasonal-prediction")
async def seasonal_prediction(request: SeasonalPredictionRequest) -> dict[str, Any]:
    """
    Predict seasonal disease risks for a patient based on:
    - Age, current month, and season
    - Previous diagnoses
    - Chronic conditions
    Returns the top-3 disease risks with probability percentages.
    """
    if seasonal_model is None or le_season is None or le_prev is None or le_disease is None:
        raise HTTPException(
            status_code=503,
            detail="Seasonal prediction model is not loaded. Please run the training script."
        )

    assert seasonal_model is not None
    assert le_season is not None
    assert le_prev is not None
    assert le_disease is not None

    try:
        # ── Encode season ──────────────────────────────────────────────
        known_seasons = list(le_season.classes_)
        season_val = request.season if request.season in known_seasons else "Spring"
        season_encoded = int(le_season.transform([season_val])[0])

        # ── Encode previous disease (first diagnosis in history) ───────
        known_prev = list(le_prev.classes_)
        
        # Combine previous_diseases and chronic_conditions for richer context
        all_conditions = request.previous_diseases + request.chronic_conditions
        prev_disease = "None"
        for condition in all_conditions:
            if condition and condition in known_prev:
                prev_disease = condition
                break
        
        prev_encoded = int(le_prev.transform([prev_disease])[0])

        # ── Run prediction ─────────────────────────────────────────────
        X = np.array([[request.age, request.month, season_encoded, prev_encoded]])
        probabilities = seasonal_model.predict_proba(X)[0]
        disease_classes = list(le_disease.classes_)

        # Build risk list, filter low-probability diseases
        risks: list[dict[str, Any]] = []
        for disease_name, prob in zip(disease_classes, probabilities):
            prob_float = float(prob)
            if prob_float > 0.05:
                risks.append({
                    "disease": str(disease_name),
                    "risk": float(f"{prob_float * 100.0:.2f}")
                })

        # Sort and take top 3
        risks.sort(key=lambda x: x["risk"], reverse=True)
        top_risks = [risks[i] for i in range(min(3, len(risks)))]

        # ── Contextual advice per season ───────────────────────────────
        season_advice = {
            "Winter": "Stay warm, get flu vaccination, avoid crowded places.",
            "Spring": "Watch for allergy triggers, pollen counts are high.",
            "Summer": "Stay hydrated, use sun protection, watch for heat-related illness.",
            "Autumn": "Boost immunity, prepare for cold and flu season."
        }

        logger.info(
            f"Seasonal prediction for patient {request.patient_id}: "
            f"season={request.season}, top_risk={top_risks[0]['disease'] if top_risks else 'N/A'}"
        )

        return {
            "Patient Forecast": {
                "Patient ID": request.patient_id,
                "Season": request.season,
                "Month": request.month,
                "Age": request.age,
                "Top Risks": top_risks,
                "Season Advice": season_advice.get(request.season, "Maintain regular health check-ups."),
                "Chronic Conditions Considered": request.chronic_conditions
            }
        }

    except Exception as e:
        logger.error(f"Seasonal prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/ai/disease-progression")
async def disease_progression(request: DiseaseProgressionRequest) -> dict[str, Any]:
    """
    Analyze disease progression risks based on:
    - Patient diagnosis history (list of DiagnosisEntry objects)
    - Latest vital signs
    - Chronic conditions
    Returns future disease risks via association rules + vital sign risk flags.
    """
    if progression_rules is None:
        raise HTTPException(
            status_code=503,
            detail="Disease progression model is not loaded. Please run the training script."
        )

    assert progression_rules is not None

    try:
        # ── Extract disease names from structured history ──────────────
        disease_names = []
        
        # From diagnosis history
        for entry in request.history:
            disease = entry.disease
            if disease is not None and disease.strip():
                disease_names.append(disease.strip())
        
        # Also include chronic conditions
        for condition in request.chronic_conditions:
            if condition is not None and condition.strip():
                disease_names.append(condition.strip())

        # Deduplicate while preserving order
        seen = set()
        unique_diseases = []
        for d in disease_names:
            if d not in seen:
                unique_diseases.append(d)
                seen.add(d)

        history_set = set(unique_diseases)

        # ── Apply association rules for progression analysis ───────────
        future_risks: list[dict[str, Any]] = []
        seen_risks = set()

        for _, rule in progression_rules.iterrows():
            antecedents = set(rule['antecedents'])
            if antecedents.issubset(history_set):
                confidence = float(rule['confidence'])
                lift = float(rule['lift'])
                for consequent_disease in list(rule['consequents']):
                    if consequent_disease not in history_set and consequent_disease not in seen_risks:
                        probability_pct = float(f"{confidence * 100.0:.2f}")
                        future_risks.append({
                            "disease": str(consequent_disease),
                            "probability": f"{probability_pct}%",
                            "confidence": confidence,
                            "lift": float(f"{lift:.2f}"),
                            "based_on": list(antecedents)
                        })
                        seen_risks.add(consequent_disease)

        # Sort by confidence descending
        future_risks.sort(key=lambda x: x["confidence"], reverse=True)

        # ── Assess vitals risk flags ───────────────────────────────────
        vitals_risks = assess_vitals_risk(request.vitals)

        # ── Severity summary from current diagnoses ────────────────────
        severity_counts = {"mild": 0, "moderate": 0, "severe": 0}
        active_conditions = []
        for entry in request.history:
            severity = entry.severity
            status = entry.status
            disease = entry.disease
            if severity is not None and severity.lower() in severity_counts:
                severity_counts[severity.lower()] += 1
            if status is not None and status.lower() == "active" and disease is not None:
                active_conditions.append(disease)

        # ── Overall risk level ─────────────────────────────────────────
        risk_level = "Low"
        if len(future_risks) >= 3 or severity_counts["severe"] > 0 or len(vitals_risks) >= 2:
            risk_level = "High"
        elif len(future_risks) >= 1 or severity_counts["moderate"] > 0 or len(vitals_risks) >= 1:
            risk_level = "Moderate"

        logger.info(
            f"Progression analysis for patient {request.patient_id}: "
            f"history_size={len(history_set)}, future_risks={len(future_risks)}, risk_level={risk_level}"
        )

        return {
            "Patient Risk Analysis": {
                "Patient ID": request.patient_id,
                "History Found": list(history_set),
                "Active Conditions": active_conditions,
                "Chronic Conditions": request.chronic_conditions,
                "Future Risks": [future_risks[i] for i in range(min(5, len(future_risks)))],
                "Vitals Risk Flags": vitals_risks,
                "Severity Summary": severity_counts,
                "Overall Risk Level": risk_level,
                "Total Conditions Analyzed": len(history_set)
            }
        }

    except Exception as e:
        logger.error(f"Disease progression error: {e}")
        raise HTTPException(status_code=500, detail=f"Progression analysis failed: {str(e)}")


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn  # type: ignore
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting MedSmart AI Healthcare Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
