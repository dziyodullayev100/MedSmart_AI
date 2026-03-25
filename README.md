# MedSmart — AI-Powered Medical Management System

## Overview
MedSmart is a comprehensive healthcare management and AI-diagnostic platform designed for clinical efficiency. By fusing a robust Node.js foundation with an advanced Python FastAPI Machine Learning backend, the system seamlessly handles everything from patient scheduling and financial tracking to predictive disease progression and automated seasonal triage.

Built entirely as a scalable 3-tier Layered Architecture, it bridges traditional clinic operations with cutting-edge analytics—identifying latent risk factors before they develop into critical conditions. The frontend orchestrates a reactive app state supported by offline tolerance and priority queueing, ensuring practitioners never lose data even during network failures.

## Features
- ✅ **Centralized Patient Profiles:** Complete history, vitals tracking, and chronological records.
- ✅ **Role Based Access Control (RBAC):** Military-grade token refresh systems separating Admins, Doctors, and Patients.
- ✅ **AI Diagnostic Engine:** Detects Seasonal probabilities and Progression associations via Random Forest and Apriori ML.
- ✅ **Medical Chatbot:** Real-time NLP-driven symptom intent extraction and conversational history tracking.
- ✅ **Automated Triage System:** Instant severity analytics with emergency alerts utilizing cross-referenced symptoms.
- ✅ **Priority Offline Syncing:** High-latency durable local caches for remote field operations.
- ✅ **Monitoring & Alerting Daemon:** Self-healing health-checks, ring-buffering CPU/Memory constraints per minute.
- ✅ **Automated DB Snapshotting:** In-memory SQLite backups on rotational CRON lifecycles.

## Architecture
```
[ Frontend: Vanilla JS Reactive App ]
           │    │    │
           │    ▼    │
           │ JWT/API │
           │         ▼
[ Backend: Node.js / Express Core ] ◄──► [ SQLite Data / PostgreSQL ]
           │            
           │ Internal Proxy
           ▼             
[ AI Service: Python FastAPI Server ]
     (ML Models, Random Forest, Scikit)
```

## Quick Start

### Prerequisites
- Node.js `v20+`
- Python `3.11+`
- Git

### Installation
```bash
# 1. Clone & install Backend dependencies
git clone https://github.com/your-username/medsmart.git
cd medsmart/backend
npm install

# 2. Install AI Service dependencies
cd ../ai_service
pip install -r requirements.txt

# 3. Secure Variables
cp .env.example .env
```

### Running with Docker
A production optimized orchestrator is included out of the box.
```bash
docker-compose up --build -d
```
> The Frontend will act as static assets served by the Node cluster, or deployed standalone automatically.

### Running manually
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - AI Models Server
cd ai_service && python run.py
```

## API Documentation

| Method | Path | Description | Authentication |
|---|---|---|---|
| `POST` | `/api/users/login` | Obtains secure JWT + Refresh Token | None |
| `GET`  | `/api/medsmart/patients` | Retrieve all registered patients | Protected |
| `POST` | `/api/ai/seasonal-prediction` | Calculate top-3 disease risks | Protected |
| `POST` | `/api/ai/chat` | Send NLP symptom extraction queries | Protected |
| `GET`  | `/api/health/full` | Advanced telemetry & system status | None |
| `POST` | `/api/demo/seed` | Trigger automated realistic seeders | Admin |

## AI Features
- **Seasonal Prediction (Random Forest):** Predicts patient susceptibility across 4 seasons tracking localized historical data.
- **Disease Progression (Apriori Algorithm):** Looks at patient history + vitals to map conditional likelihood of evolving latent diseases via calculated *Lift and Confidence* maps.
- **Triage Assessment:** Swift pattern matching returning HIGH/MEDIUM/LOW priority handling based on severity and durations.
- **NLP Chat Engine:** Live extraction capturing user inputs and resolving true hidden intent mappings without structured forms.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Application lifecycle context | `production` |
| `PORT` | Bound internal networking port | `5000` |
| `JWT_SECRET` | 64-char crypto signature key | `d2a938...` |
| `AI_SERVICE_URL` | Fast API routing tunnel | `http://localhost:8000` |
| `DEMO_MODE` | Expose orchestrated seeders | `true` |
| `BACKUP_ENABLED` | Scheduled SQLite dumps | `true` |

## Demo Mode
To prepare the system for prospective clients or investors:
1. Initialize the backend: `npm run seed:demo`
2. Navigate to the login route with the query string configured:  
   `http://localhost:5000/?demo=true`
3. The visual navigator will securely inject `admin@medsmart.uz` credentials and orchestrate an automated UI tour.

## Deployment
This repository is pre-configured via `.github/workflows`:
1. **Render.com (Backend & AI):** Push to `main` auto-triggers deep static analysis, unit tests, and seamless multi-node deployment.
2. **Netlify (Frontend):** Bind your static `frontend/` directory to track the repository directly. Production API bases can be overridden dynamically.

## Project Structure
```
medsmart/
├── frontend/             # Root vanilla UI, reactive DOM managers
├── backend/
│   ├── config/           # DB connectors, production headers
│   ├── controllers/      # Route logic, RBAC checks
│   ├── utils/            # Backup crons, Monitors, Alarms
│   └── seed_demo.js      # Realistic demographic seeder
├── ai_service/
│   ├── api.py            # FastAPI entry
│   ├── models/           # Scikit .pkl files
│   └── utils/            # Chat engines, symptom extractors
└── docker-compose.yml    # Production container definitions
```

## License
MIT License. Created by the MED SMART Team.
