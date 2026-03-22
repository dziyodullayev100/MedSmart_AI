"""
ai_test.py - Test client for MedSmart AI Service endpoints
Usage: python ai_test.py
Requires: AI service running on http://localhost:8000
"""
from __future__ import annotations
import sys
import json

try:
    import urllib.request
    import urllib.error

    BASE_URL = "http://localhost:8000"

    def post_json(path: str, payload: dict) -> tuple[int, dict]:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            return e.code, json.loads(body) if body else {}

    def get_json(path: str) -> tuple[int, dict]:
        req = urllib.request.Request(f"{BASE_URL}{path}", method="GET")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return e.code, {}

    def separator(title: str):
        print(f"\n{'='*55}")
        print(f"  {title}")
        print('='*55)

    def check(label: str, status: int, body: dict, expected_status: int = 200):
        ok = "✓" if status == expected_status else "✗"
        print(f"  [{ok}] {label} -> HTTP {status}")
        if status != expected_status:
            print(f"       ERROR: {body}")

    # ── 1. Health Check ────────────────────────────────────────────────
    separator("1. Health Check")
    status, body = get_json("/health")
    check("GET /health", status, body)
    print(f"       Service: {body.get('service')}")
    print(f"       Models loaded: {body.get('models_loaded')}")
    print(f"       Status: {body.get('status')}")

    if not body.get("models_loaded"):
        print("\n⚠ Models not loaded. Please run training scripts first.")
        sys.exit(1)

    # ── 2. Seasonal Prediction - Winter / elderly patient ─────────────
    separator("2. Seasonal Prediction (Winter, age 65)")
    status, body = post_json("/ai/seasonal-prediction", {
        "patient_id": "test-001",
        "age": 65,
        "month": 1,
        "season": "Winter",
        "previous_diseases": ["Flu"],
        "chronic_conditions": ["Hypertension"]
    })
    check("POST /ai/seasonal-prediction", status, body)
    if status == 200:
        forecast = body.get("Patient Forecast", {})
        print(f"       Season: {forecast.get('Season')}")
        print(f"       Top Risks: {json.dumps(forecast.get('Top Risks', []), indent=8)}")
        print(f"       Advice: {forecast.get('Season Advice')}")

    # ── 3. Seasonal Prediction - Summer / young patient ───────────────
    separator("3. Seasonal Prediction (Summer, age 22)")
    status, body = post_json("/ai/seasonal-prediction", {
        "patient_id": "test-002",
        "age": 22,
        "month": 7,
        "season": "Summer",
        "previous_diseases": ["Allergy"],
        "chronic_conditions": []
    })
    check("POST /ai/seasonal-prediction", status, body)
    if status == 200:
        forecast = body.get("Patient Forecast", {})
        print(f"       Top Risks: {json.dumps(forecast.get('Top Risks', []), indent=8)}")

    # ── 4. Disease Progression - Diabetic patient ─────────────────────
    separator("4. Disease Progression (Diabetic patient with hypertension)")
    status, body = post_json("/ai/disease-progression", {
        "patient_id": "test-003",
        "history": [
            {
                "disease": "Diabetes",
                "severity": "moderate",
                "symptoms": ["fatigue", "thirst"],
                "date": "2024-01-15",
                "status": "active",
                "doctor": "Dr. Smith"
            },
            {
                "disease": "Hypertension",
                "severity": "mild",
                "symptoms": ["headache"],
                "date": "2024-03-10",
                "status": "active",
                "doctor": "Dr. Jones"
            }
        ],
        "vitals": {
            "bloodPressure": "145/92",
            "heartRate": 88,
            "temperature": 36.7,
            "oxygenSaturation": 97.0,
            "weight": 90.0,
            "recordedAt": "2025-03-21T10:00:00Z"
        },
        "chronic_conditions": ["Diabetes", "Hypertension"]
    })
    check("POST /ai/disease-progression", status, body)
    if status == 200:
        analysis = body.get("Patient Risk Analysis", {})
        print(f"       History Found: {analysis.get('History Found')}")
        print(f"       Future Risks: {json.dumps(analysis.get('Future Risks', []), indent=8)}")
        print(f"       Vitals Flags: {analysis.get('Vitals Risk Flags')}")
        print(f"       Overall Risk Level: {analysis.get('Overall Risk Level')}")

    # ── 5. Disease Progression - empty history ────────────────────────
    separator("5. Disease Progression (No history)")
    status, body = post_json("/ai/disease-progression", {
        "patient_id": "test-004",
        "history": [],
        "vitals": None,
        "chronic_conditions": []
    })
    check("POST /ai/disease-progression", status, body)
    if status == 200:
        analysis = body.get("Patient Risk Analysis", {})
        print(f"       Future Risks: {analysis.get('Future Risks')}")
        print(f"       Overall Risk Level: {analysis.get('Overall Risk Level')}")

    print("\n" + "="*55)
    print("  ✓ All AI Service tests completed.")
    print("="*55 + "\n")

except ConnectionRefusedError:
    print("\n✗ Could not connect to AI service at http://localhost:8000")
    print("  Make sure the AI service is running: python run.py")
    sys.exit(1)
except Exception as e:
    print(f"\n✗ Test failed with unexpected error: {e}")
    sys.exit(1)
