from __future__ import annotations
import os
import logging
import json
import uuid
from collections import deque
from typing import Any, Optional, Literal
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medsmart_ai")

from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel, Field  # type: ignore
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

try:
    from config.production_config import apply_production_config # type: ignore
    apply_production_config(app)
except ImportError as e:
    logger.warning("Production config not found or failed to load. Running default.")

# Allow requests from Node.js backend and any local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Input Schemas with Validation (Task 5) ───────────────────────────────────

class SeasonalPredictionRequest(BaseModel):
    """Request body for seasonal disease prediction with Pydantic validation."""
    patient_id: Any
    age: int = Field(..., ge=1, le=120, description="Patient age between 1 and 120.")
    month: int = Field(..., ge=1, le=12, description="Month of the year (1-12).")
    season: Literal["Winter", "Spring", "Summer", "Autumn"] = Field(
        ..., description="Current season."
    )
    previous_diseases: list[str] = Field(
        default=[], max_length=20, description="List of previous diseases."
    )
    chronic_conditions: list[str] = Field(
        default=[], max_length=20, description="List of chronic conditions."
    )

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
    """Request body for disease progression analysis with Pydantic validation."""
    patient_id: Any
    history: list[DiagnosisEntry] = Field(
        default=[], max_length=50, description="Patient diagnosis history (max 50 items)."
    )
    vitals: Optional[VitalsData] = None
    chronic_conditions: list[str] = Field(
        default=[], max_length=20, description="List of chronic conditions."
    )

class ConversationTurn(BaseModel):
    """A single turn in the conversation history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., max_length=1000)

class ChatRequest(BaseModel):
    """Request body for conversational AI with Pydantic validation."""
    message: str = Field(..., min_length=1, max_length=500, description="User message/query.")
    session_id: Optional[str] = Field(default=None, description="Optional session ID for context.")
    conversation_history: Optional[list[ConversationTurn]] = Field(
        default=None, max_length=10, description="Last 10 conversation turns."
    )

class ChatResponse(BaseModel):
    """Response body from conversational AI."""
    reply: str
    metadata: Optional[dict[str, Any]] = None

# ── Triage schemas ──────────────────────────────────────────────────────────

class TriageRequest(BaseModel):
    """Request body for quick medical triage assessment."""
    symptoms: list[str] = Field(..., max_length=30, description="List of symptoms.")
    age: int = Field(..., ge=1, le=120, description="Patient age.")
    duration_days: int = Field(..., ge=0, description="How many days symptoms have been present.")
    severity: Literal["mild", "moderate", "severe"] = Field(..., description="Symptom severity.")

class TriageResponse(BaseModel):
    """Response body for triage assessment."""
    triage_level: Literal["HIGH", "MEDIUM", "LOW"]
    recommendation: str
    seek_emergency: bool
    estimated_wait: str
    matched_symptoms: list[str]

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

# ─── Load MedicalChatEngine ────────────────────────────────────────────────────
try:
    from utils.medical_chat import chat_engine  # type: ignore
    logger.info("✓ MedicalChatEngine loaded successfully.")
except Exception as _chat_import_err:
    logger.error(f"Failed to load MedicalChatEngine: {_chat_import_err}")
    chat_engine = None  # type: ignore

# ─── In-memory session store (last 5 messages per session) ────────────────────
# Key: session_id (str) → deque of ConversationTurn dicts
_SESSION_STORE: dict[str, deque] = {}
SESSION_MAX_TURNS = 10  # store per session


def _get_session_history(session_id: str) -> list[dict]:
    if session_id not in _SESSION_STORE:
        _SESSION_STORE[session_id] = deque(maxlen=SESSION_MAX_TURNS)
    return list(_SESSION_STORE[session_id])


def _push_to_session(session_id: str, role: str, content: str) -> None:
    if session_id not in _SESSION_STORE:
        _SESSION_STORE[session_id] = deque(maxlen=SESSION_MAX_TURNS)
    _SESSION_STORE[session_id].append({"role": role, "content": content})

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

# Task 4 — New Metrics Endpoint
@app.get("/ai/metrics")
async def get_metrics() -> dict[str, Any]:
    """
    Returns content of seasonal_metrics.json and progression_metrics.json.
    If a file does not exist, returns null for that section.
    No authentication required (internal monitoring endpoint).
    """
    models_dir = os.path.join(BASE_DIR, "models")
    seasonal_path = os.path.join(models_dir, "seasonal_metrics.json")
    progression_path = os.path.join(models_dir, "progression_metrics.json")

    seasonal_data = None
    if os.path.exists(seasonal_path):
        try:
            with open(seasonal_path, "r", encoding="utf-8") as f:
                seasonal_data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading {seasonal_path}: {e}")

    progression_data = None
    if os.path.exists(progression_path):
        try:
            with open(progression_path, "r", encoding="utf-8") as f:
                progression_data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading {progression_path}: {e}")

    return {
        "seasonal_model": seasonal_data,
        "progression_model": progression_data,
        "generated_at": datetime.utcnow().isoformat() + "Z"
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

        # ── Encode previous disease ────────────────────────────────────
        known_prev = list(le_prev.classes_)
        
        # Combine previous_diseases and chronic_conditions for richer context
        all_conditions = request.previous_diseases + request.chronic_conditions
        prev_disease = "None"
        for condition in all_conditions:
            if condition and condition in known_prev:
                prev_disease = condition
                break
        
        if prev_disease in known_prev:
            prev_encoded = int(le_prev.transform([prev_disease])[0])
        else:
            prev_encoded = 0  # Safe fallback for unseen or missing diseases

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
    - Patient diagnosis history
    - Latest vital signs
    - Chronic conditions
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


# ─── POST /ai/chat  (Conversational AI — upgraded with MedicalChatEngine) ─────

# Known emergency symptoms for triage (also used in /ai/triage)
_EMERGENCY_SYMPTOMS_SET = {
    "chest pain", "shortness of breath", "unconscious", "severe bleeding",
    "stroke", "trouble speaking", "facial drooping", "numbness",
    "heart palpitations", "blurred vision",
}


@app.post("/ai/chat")
async def ai_chat(request: ChatRequest) -> dict[str, Any]:
    """
    Upgraded Conversational AI endpoint.
    Accepts: { message, session_id?, conversation_history? }
    Returns:  { reply: str, metadata: { intent, symptoms_detected, emergency, confidence, language } }
    Node.js backend compatibility: reply field is always present.
    """
    message = request.message.strip()

    if not message:
        return {
            "reply": "Iltimos, savol yoki simptomlaringizni kiriting.",
            "metadata": {"intent": "general_info", "symptoms_detected": [], "emergency": False, "confidence": 0.0, "language": "uz"},
        }

    # ── Resolve session ID ────────────────────────────────────────────────
    session_id = request.session_id or str(uuid.uuid4())

    # ── Build history from request + server-side session ─────────────────
    history: list[dict] = []
    if request.conversation_history:
        raw_history = list(request.conversation_history)  # type: ignore[arg-type]
        trimmed = (raw_history[-10:] if len(raw_history) > 10 else raw_history)  # type: ignore[index]
        history = [t.model_dump() for t in trimmed]
    else:
        history = _get_session_history(session_id)

    # ── Run MedicalChatEngine ─────────────────────────────────────────────
    if chat_engine is not None:
        result = chat_engine.process(message, history)
        reply: str = result["reply"]
        metadata: dict[str, Any] = result["metadata"]
    else:
        # Graceful degradation if engine failed to load
        reply = (
            "I received your message. For medical advice, please consult a doctor. "
            "If this is an emergency, call 103 immediately."
        )
        metadata = {"intent": "general_info", "symptoms_detected": [], "emergency": False, "confidence": 0.5, "language": "en"}

    # ── Persist turns to session store ────────────────────────────────────
    _push_to_session(session_id, "user", message)
    _push_to_session(session_id, "assistant", reply)

    short = (message[:60] + "...") if len(message) > 60 else str(message)  # type: ignore[index]
    logger.info(
        f"[AI Chat] session={session_id} intent={metadata.get('intent')} "
        f"emergency={metadata.get('emergency')} query='{short}'"
    )

    return {"reply": reply, "metadata": metadata}


# ─── POST /ai/triage  (Quick Medical Triage Assessment) ──────────────────────

# Emergency symptom keywords for triage matching
_TRIAGE_EMERGENCY_KEYWORDS = [
    "chest pain", "shortness of breath", "difficulty breathing",
    "unconscious", "unresponsive", "stroke", "severe bleeding",
    "heart attack", "cardiac arrest", "can't breathe", "not breathing",
    "facial drooping", "trouble speaking", "numbness",
]

# All known canonical symptoms (flat list for matching)
_ALL_CANONICAL_SYMPTOMS = [
    "fever", "headache", "cough", "fatigue", "chest pain",
    "shortness of breath", "nausea", "vomiting", "dizziness",
    "back pain", "joint pain", "sore throat", "runny nose",
    "stomach pain", "diarrhea", "constipation", "rash", "itching",
    "swelling", "blurred vision", "heart palpitations", "numbness",
    "tingling", "confusion", "unconscious", "severe bleeding", "bleeding",
    "stroke", "trouble speaking", "facial drooping", "loss of appetite",
    "insomnia", "muscle pain", "migraine", "anxiety", "depression",
]


@app.post("/ai/triage", response_model=TriageResponse)
async def ai_triage(request: TriageRequest) -> TriageResponse:
    """
    Quick medical triage assessment.
    Accepts: { symptoms: list[str], age: int, duration_days: int, severity: str }
    Returns: { triage_level, recommendation, seek_emergency, estimated_wait, matched_symptoms }
    """
    # ── Normalise & match submitted symptoms ─────────────────────────────
    matched: list[str] = []
    submitted_lower = [s.lower().strip() for s in request.symptoms]

    for sym in submitted_lower:
        # Direct canonical match
        if sym in _ALL_CANONICAL_SYMPTOMS:
            matched.append(sym)
            continue
        # Partial match against canonical list
        for canonical in _ALL_CANONICAL_SYMPTOMS:
            if sym in canonical or canonical in sym:
                if canonical not in matched:
                    matched.append(canonical)
                break

    # ── Determine if any emergency symptom is present ────────────────────
    has_emergency_sym = bool(
        set(matched) & _EMERGENCY_SYMPTOMS_SET
        or any(kw in " ".join(submitted_lower) for kw in _TRIAGE_EMERGENCY_KEYWORDS)
    )

    # ── Triage logic ─────────────────────────────────────────────────────
    triage_level: Literal["HIGH", "MEDIUM", "LOW"]
    seek_emergency: bool
    estimated_wait: str
    recommendation: str

    if (
        has_emergency_sym
        or request.severity == "severe"
        or (request.duration_days > 7 and request.severity == "moderate")
        or (request.age >= 65 and request.severity == "moderate" and request.duration_days >= 3)
    ):
        triage_level = "HIGH"
        seek_emergency = True
        estimated_wait = "Immediate"
        recommendation = (
            "Your symptoms indicate a HIGH priority medical situation. "
            "Please seek emergency care immediately or call 103. "
            "Do not wait — have someone take you to the nearest hospital now."
        )
    elif (
        len(matched) >= 2
        or (3 <= request.duration_days <= 7)
        or (request.severity == "moderate")
    ):
        triage_level = "MEDIUM"
        seek_emergency = False
        estimated_wait = "Within 24h"
        recommendation = (
            "Your symptoms suggest a MEDIUM priority concern. "
            "You should see a doctor within 24 hours. "
            "Monitor your symptoms closely — if they worsen, seek emergency care."
        )
    else:
        triage_level = "LOW"
        seek_emergency = False
        estimated_wait = "Within 3 days"
        recommendation = (
            "Your symptoms appear to be LOW priority at this time. "
            "Rest, stay hydrated, and monitor your condition. "
            "Schedule a non-urgent appointment with your doctor if symptoms persist."
        )

    logger.info(
        f"[Triage] level={triage_level} symptoms={matched} "
        f"age={request.age} duration={request.duration_days}d severity={request.severity}"
    )

    return TriageResponse.model_validate({
        "triage_level": triage_level,
        "recommendation": recommendation,
        "seek_emergency": seek_emergency,
        "estimated_wait": estimated_wait,
        "matched_symptoms": matched,
    })


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn  # type: ignore
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting MedSmart AI Healthcare Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
