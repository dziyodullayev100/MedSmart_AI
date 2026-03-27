-- =============================================================================
-- MedSmart — Complete PostgreSQL Database Schema
-- Version: 1.0.0
-- Generated: 2026-03-27
-- Description: Full relational schema for a real medical management system
--              with AI diagnostic integration.
-- =============================================================================

-- Enable UUID extension (optional, kept as SERIAL per spec)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enforce UTC timestamps at session level (run this at connection time)
-- SET TIME ZONE 'UTC';

-- =============================================================================
-- SECTION 1: USERS & AUTH
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: users
-- Purpose: Core authentication and identity table for every system actor
--          (admins, doctors, receptionists, patients with portal access).
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,

    -- Identity
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20)     UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,

    -- Personal info
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    middle_name     VARCHAR(100),
    date_of_birth   DATE,
    gender          VARCHAR(10)     CHECK (gender IN ('male', 'female', 'other')),
    avatar_url      TEXT,

    -- Role & status
    role            VARCHAR(30)     NOT NULL DEFAULT 'patient'
                                    CHECK (role IN ('superadmin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN         NOT NULL DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,

    -- Security
    failed_login_attempts   INT     NOT NULL DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    password_changed_at     TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email          ON users (email);
CREATE INDEX idx_users_phone          ON users (phone);
CREATE INDEX idx_users_role           ON users (role);
CREATE INDEX idx_users_is_active      ON users (is_active);
CREATE INDEX idx_users_created_at     ON users (created_at DESC);

COMMENT ON TABLE  users                        IS 'Core identity and authentication table for all system actors.';
COMMENT ON COLUMN users.role                   IS 'System role: superadmin, admin, doctor, nurse, receptionist, patient.';
COMMENT ON COLUMN users.failed_login_attempts  IS 'Counter reset to 0 on successful login; triggers lock after threshold.';
COMMENT ON COLUMN users.locked_until           IS 'Account locked from login until this timestamp (brute-force protection).';


-- -----------------------------------------------------------------------------
-- TABLE: refresh_tokens
-- Purpose: Stores JWT refresh tokens for stateful session management and
--          token revocation (logout, rotation, multi-device support).
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id              SERIAL          PRIMARY KEY,

    user_id         INT             NOT NULL
                                    REFERENCES users (id)
                                    ON DELETE CASCADE
                                    ON UPDATE CASCADE,

    token_hash      VARCHAR(512)    NOT NULL UNIQUE,   -- SHA-256 hash of the raw token
    device_info     TEXT,                               -- Browser/OS fingerprint
    ip_address      VARCHAR(45),                        -- IPv4 or IPv6
    is_revoked      BOOLEAN         NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ     NOT NULL,

    -- Timestamps
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id     ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash  ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at  ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked  ON refresh_tokens (is_revoked);

COMMENT ON TABLE  refresh_tokens             IS 'Stateful refresh token store enabling revocation and multi-device sessions.';
COMMENT ON COLUMN refresh_tokens.token_hash  IS 'Stored as a cryptographic hash; raw token is never persisted.';


-- =============================================================================
-- SECTION 2: MEDICAL STAFF & PATIENTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: doctors
-- Purpose: Extended professional profile for users with role = 'doctor'.
--          Linked 1-to-1 with users table.
-- -----------------------------------------------------------------------------
CREATE TABLE doctors (
    id                  SERIAL          PRIMARY KEY,

    user_id             INT             NOT NULL UNIQUE
                                        REFERENCES users (id)
                                        ON DELETE CASCADE
                                        ON UPDATE CASCADE,

    -- Professional details
    license_number      VARCHAR(100)    NOT NULL UNIQUE,
    specialization      VARCHAR(150)    NOT NULL,   -- e.g. 'Cardiology', 'Neurology'
    sub_specialization  VARCHAR(150),
    qualification       VARCHAR(255),               -- e.g. 'MD, PhD'
    years_of_experience INT             CHECK (years_of_experience >= 0),
    bio                 TEXT,

    -- Employment
    department          VARCHAR(150),
    employment_type     VARCHAR(20)     NOT NULL DEFAULT 'full_time'
                                        CHECK (employment_type IN ('full_time', 'part_time', 'consultant', 'intern')),
    is_available        BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Contact
    office_phone        VARCHAR(20),
    office_room         VARCHAR(50),
    consultation_fee    NUMERIC(10, 2)  CHECK (consultation_fee >= 0),

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for doctors
CREATE INDEX idx_doctors_user_id         ON doctors (user_id);
CREATE INDEX idx_doctors_specialization  ON doctors (specialization);
CREATE INDEX idx_doctors_is_available    ON doctors (is_available);
CREATE INDEX idx_doctors_department      ON doctors (department);

COMMENT ON TABLE  doctors                     IS 'Extended professional profile for medical doctors linked to a user account.';
COMMENT ON COLUMN doctors.license_number      IS 'Government-issued medical license number; must be unique per jurisdiction.';
COMMENT ON COLUMN doctors.employment_type     IS 'full_time | part_time | consultant | intern.';


-- -----------------------------------------------------------------------------
-- TABLE: patients
-- Purpose: Extended medical profile for users with role = 'patient'.
--          Central node referenced by most clinical tables.
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
    id                  SERIAL          PRIMARY KEY,

    user_id             INT             NOT NULL UNIQUE
                                        REFERENCES users (id)
                                        ON DELETE CASCADE
                                        ON UPDATE CASCADE,

    -- Identification
    patient_code        VARCHAR(50)     NOT NULL UNIQUE,   -- e.g. 'PAT-00001'
    national_id         VARCHAR(50)     UNIQUE,            -- Government ID / passport

    -- Demographics
    blood_type          VARCHAR(5)      CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
    height_cm           NUMERIC(5, 2)   CHECK (height_cm > 0),
    weight_kg           NUMERIC(5, 2)   CHECK (weight_kg > 0),
    marital_status      VARCHAR(20)     CHECK (marital_status IN ('single','married','divorced','widowed','unknown')),
    occupation          VARCHAR(150),

    -- Medical admin
    insurance_provider  VARCHAR(150),
    insurance_policy_no VARCHAR(100),
    insurance_expiry    DATE,
    primary_doctor_id   INT             REFERENCES doctors (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Emergency contact
    emergency_contact_name      VARCHAR(200),
    emergency_contact_phone     VARCHAR(20),
    emergency_contact_relation  VARCHAR(50),

    -- Status
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for patients
CREATE INDEX idx_patients_user_id           ON patients (user_id);
CREATE INDEX idx_patients_patient_code      ON patients (patient_code);
CREATE INDEX idx_patients_primary_doctor    ON patients (primary_doctor_id);
CREATE INDEX idx_patients_blood_type        ON patients (blood_type);
CREATE INDEX idx_patients_is_active         ON patients (is_active);

COMMENT ON TABLE  patients                   IS 'Extended medical and administrative profile for registered patients.';
COMMENT ON COLUMN patients.patient_code      IS 'Human-readable unique identifier assigned at registration (e.g. PAT-00001).';
COMMENT ON COLUMN patients.primary_doctor_id IS 'Assigned general practitioner; nullable when doctor leaves.';


-- =============================================================================
-- SECTION 3: CLINIC OPERATIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: services
-- Purpose: Catalog of all medical services/procedures offered by the clinic,
--          including pricing and duration — used for billing and scheduling.
-- -----------------------------------------------------------------------------
CREATE TABLE services (
    id                  SERIAL          PRIMARY KEY,

    name                VARCHAR(255)    NOT NULL,
    code                VARCHAR(50)     NOT NULL UNIQUE,   -- Internal/ICD billing code
    category            VARCHAR(100)    NOT NULL,          -- e.g. 'Consultation', 'Lab', 'Imaging'
    description         TEXT,

    -- Pricing
    base_price          NUMERIC(10, 2)  NOT NULL CHECK (base_price >= 0),
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',

    -- Scheduling
    duration_minutes    INT             NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    requires_doctor     BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Status
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for services
CREATE INDEX idx_services_category   ON services (category);
CREATE INDEX idx_services_code       ON services (code);
CREATE INDEX idx_services_is_active  ON services (is_active);

COMMENT ON TABLE services IS 'Catalog of all medical services/procedures with pricing and scheduling metadata.';


-- -----------------------------------------------------------------------------
-- TABLE: appointments
-- Purpose: Tracks every patient-doctor appointment including scheduling,
--          status lifecycle, and linked service. Core of clinic operations.
-- -----------------------------------------------------------------------------
CREATE TABLE appointments (
    id                  SERIAL          PRIMARY KEY,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    doctor_id           INT             NOT NULL
                                        REFERENCES doctors (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    service_id          INT             REFERENCES services (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Scheduling
    scheduled_at        TIMESTAMPTZ     NOT NULL,
    duration_minutes    INT             NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    ended_at            TIMESTAMPTZ,

    -- Status lifecycle
    status              VARCHAR(30)     NOT NULL DEFAULT 'scheduled'
                                        CHECK (status IN (
                                            'scheduled', 'confirmed', 'in_progress',
                                            'completed', 'cancelled', 'no_show', 'rescheduled'
                                        )),
    cancellation_reason TEXT,
    cancelled_by        INT             REFERENCES users (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Clinical notes
    chief_complaint     TEXT,
    appointment_notes   TEXT,
    follow_up_date      DATE,

    -- Meta
    visit_type          VARCHAR(30)     NOT NULL DEFAULT 'in_person'
                                        CHECK (visit_type IN ('in_person', 'telemedicine', 'home_visit')),
    room_number         VARCHAR(20),

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for appointments
CREATE INDEX idx_appointments_patient_id    ON appointments (patient_id);
CREATE INDEX idx_appointments_doctor_id     ON appointments (doctor_id);
CREATE INDEX idx_appointments_service_id    ON appointments (service_id);
CREATE INDEX idx_appointments_scheduled_at  ON appointments (scheduled_at);
CREATE INDEX idx_appointments_status        ON appointments (status);
CREATE INDEX idx_appointments_visit_type    ON appointments (visit_type);
-- Composite: doctor schedule lookup
CREATE INDEX idx_appointments_doctor_date   ON appointments (doctor_id, scheduled_at);
-- Composite: patient history lookup
CREATE INDEX idx_appointments_patient_date  ON appointments (patient_id, scheduled_at DESC);

COMMENT ON TABLE  appointments          IS 'Full lifecycle of patient-doctor appointments, from scheduling to completion.';
COMMENT ON COLUMN appointments.status   IS 'Lifecycle: scheduled → confirmed → in_progress → completed | cancelled | no_show.';


-- -----------------------------------------------------------------------------
-- TABLE: payments
-- Purpose: Financial records for every service rendered; supports multiple
--          payment methods and partial payment tracking.
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id                  SERIAL          PRIMARY KEY,

    appointment_id      INT             NOT NULL
                                        REFERENCES appointments (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    -- Amounts
    amount_due          NUMERIC(12, 2)  NOT NULL CHECK (amount_due >= 0),
    amount_paid         NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    discount_amount     NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount          NUMERIC(12, 2)  NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',

    -- Payment details
    payment_method      VARCHAR(30)     NOT NULL
                                        CHECK (payment_method IN (
                                            'cash', 'card', 'bank_transfer',
                                            'insurance', 'online', 'crypto', 'other'
                                        )),
    payment_status      VARCHAR(20)     NOT NULL DEFAULT 'pending'
                                        CHECK (payment_status IN (
                                            'pending', 'partial', 'paid', 'refunded', 'failed', 'waived'
                                        )),
    transaction_ref     VARCHAR(255)    UNIQUE,     -- External payment gateway reference
    insurance_claim_id  VARCHAR(255),

    -- Who processed it
    processed_by        INT             REFERENCES users (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,
    paid_at             TIMESTAMPTZ,
    notes               TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX idx_payments_appointment_id   ON payments (appointment_id);
CREATE INDEX idx_payments_patient_id       ON payments (patient_id);
CREATE INDEX idx_payments_payment_status   ON payments (payment_status);
CREATE INDEX idx_payments_payment_method   ON payments (payment_method);
CREATE INDEX idx_payments_paid_at          ON payments (paid_at DESC);
CREATE INDEX idx_payments_transaction_ref  ON payments (transaction_ref);

COMMENT ON TABLE  payments                  IS 'Financial records for clinic services with full payment lifecycle tracking.';
COMMENT ON COLUMN payments.transaction_ref  IS 'External gateway reference (Stripe charge ID, Payme transaction ID, etc.).';


-- =============================================================================
-- SECTION 4: MEDICAL DATA (AI CRITICAL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: diagnoses
-- Purpose: Clinical diagnoses assigned to a patient during an appointment,
--          with ICD coding and severity classification.
-- -----------------------------------------------------------------------------
CREATE TABLE diagnoses (
    id                  SERIAL          PRIMARY KEY,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    appointment_id      INT             REFERENCES appointments (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    doctor_id           INT             NOT NULL
                                        REFERENCES doctors (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    -- Diagnosis detail
    icd_code            VARCHAR(20)     NOT NULL,   -- ICD-10 / ICD-11 code e.g. 'J18.9'
    diagnosis_name      VARCHAR(500)    NOT NULL,
    description         TEXT,

    -- Classification
    diagnosis_type      VARCHAR(20)     NOT NULL DEFAULT 'primary'
                                        CHECK (diagnosis_type IN ('primary', 'secondary', 'differential', 'provisional')),
    severity            VARCHAR(20)     NOT NULL DEFAULT 'moderate'
                                        CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    is_chronic          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_resolved         BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Dates
    diagnosed_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,

    -- Treatment prescribed
    treatment_plan      TEXT,
    follow_up_notes     TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for diagnoses
CREATE INDEX idx_diagnoses_patient_id      ON diagnoses (patient_id);
CREATE INDEX idx_diagnoses_appointment_id  ON diagnoses (appointment_id);
CREATE INDEX idx_diagnoses_doctor_id       ON diagnoses (doctor_id);
CREATE INDEX idx_diagnoses_icd_code        ON diagnoses (icd_code);
CREATE INDEX idx_diagnoses_is_chronic      ON diagnoses (is_chronic);
CREATE INDEX idx_diagnoses_is_resolved     ON diagnoses (is_resolved);
CREATE INDEX idx_diagnoses_diagnosed_at    ON diagnoses (diagnosed_at DESC);

COMMENT ON TABLE  diagnoses              IS 'ICD-coded clinical diagnoses linked to patient visits and prescribing doctor.';
COMMENT ON COLUMN diagnoses.icd_code     IS 'International Classification of Diseases code (ICD-10 or ICD-11).';
COMMENT ON COLUMN diagnoses.is_chronic   IS 'TRUE for long-term conditions tracked across visits.';


-- -----------------------------------------------------------------------------
-- TABLE: vital_signs
-- Purpose: Time-series vital measurements recorded per patient visit.
--          Fed into AI models for trend analysis and anomaly detection.
-- -----------------------------------------------------------------------------
CREATE TABLE vital_signs (
    id                  SERIAL          PRIMARY KEY,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    appointment_id      INT             REFERENCES appointments (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    recorded_by         INT             NOT NULL
                                        REFERENCES users (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    -- Measurements (all nullable; record only what was measured)
    temperature_c       NUMERIC(4, 2)   CHECK (temperature_c BETWEEN 25 AND 45),    -- Celsius
    heart_rate_bpm      INT             CHECK (heart_rate_bpm BETWEEN 20 AND 300),  -- Beats per minute
    systolic_bp         INT             CHECK (systolic_bp BETWEEN 50 AND 300),     -- mmHg
    diastolic_bp        INT             CHECK (diastolic_bp BETWEEN 20 AND 200),    -- mmHg
    respiratory_rate    INT             CHECK (respiratory_rate BETWEEN 5 AND 60),  -- Breaths/min
    oxygen_saturation   NUMERIC(5, 2)   CHECK (oxygen_saturation BETWEEN 50 AND 100), -- SpO2 %
    blood_glucose       NUMERIC(6, 2)   CHECK (blood_glucose >= 0),                -- mg/dL
    weight_kg           NUMERIC(5, 2)   CHECK (weight_kg > 0),
    height_cm           NUMERIC(5, 2)   CHECK (height_cm > 0),
    bmi                 NUMERIC(5, 2)   CHECK (bmi > 0),                           -- Calculated

    -- Context
    measurement_context VARCHAR(30)     DEFAULT 'routine'
                                        CHECK (measurement_context IN ('routine', 'emergency', 'triage', 'remote', 'follow_up')),
    notes               TEXT,
    recorded_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for vital_signs
CREATE INDEX idx_vital_signs_patient_id      ON vital_signs (patient_id);
CREATE INDEX idx_vital_signs_appointment_id  ON vital_signs (appointment_id);
CREATE INDEX idx_vital_signs_recorded_by     ON vital_signs (recorded_by);
CREATE INDEX idx_vital_signs_recorded_at     ON vital_signs (recorded_at DESC);
-- Composite: AI trend queries (patient + time)
CREATE INDEX idx_vital_signs_patient_time    ON vital_signs (patient_id, recorded_at DESC);

COMMENT ON TABLE  vital_signs                      IS 'Time-series physiological measurements per patient visit, used for AI trend analysis.';
COMMENT ON COLUMN vital_signs.bmi                  IS 'Body Mass Index; ideally computed from weight and height, stored for fast querying.';
COMMENT ON COLUMN vital_signs.measurement_context  IS 'Clinical context: routine | emergency | triage | remote | follow_up.';


-- -----------------------------------------------------------------------------
-- TABLE: patient_history
-- Purpose: THE MOST IMPORTANT TABLE — comprehensive longitudinal medical
--          history per patient. The AI reads and writes from this table for
--          risk predictions, disease progression models, and personalized
--          recommendations. Uses PostgreSQL arrays for multi-value fields.
-- -----------------------------------------------------------------------------
CREATE TABLE patient_history (
    id                      SERIAL          PRIMARY KEY,

    patient_id              INT             NOT NULL
                                            REFERENCES patients (id)
                                            ON DELETE RESTRICT
                                            ON UPDATE CASCADE,

    -- Disease episode
    disease_name            VARCHAR(500)    NOT NULL,
    symptoms                TEXT[]          NOT NULL DEFAULT '{}',    -- Array of symptom strings
    treatment               TEXT,
    start_date              DATE            NOT NULL,
    end_date                DATE,           -- NULL if ongoing
    is_ongoing              BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Episode classification
    severity                VARCHAR(20)     NOT NULL DEFAULT 'moderate'
                                            CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    outcome                 VARCHAR(50)     CHECK (outcome IN (
                                                'recovered', 'ongoing', 'worsened',
                                                'deceased', 'transferred', 'lost_to_followup', 'unknown'
                                            )),

    -- Longitudinal medical context (AI training fields)
    chronic_conditions      TEXT[]          NOT NULL DEFAULT '{}',    -- e.g. ['Diabetes Type 2', 'Hypertension']
    current_medications     TEXT[]          NOT NULL DEFAULT '{}',    -- e.g. ['Metformin 500mg', 'Lisinopril 10mg']
    allergies               TEXT[]          NOT NULL DEFAULT '{}',    -- e.g. ['Penicillin', 'Aspirin']
    past_surgeries          TEXT[]          NOT NULL DEFAULT '{}',    -- e.g. ['Appendectomy 2019', 'ACL repair 2021']
    family_history          TEXT[]          NOT NULL DEFAULT '{}',    -- e.g. ['Father: Diabetes', 'Mother: Hypertension']

    -- Lifestyle factors (AI risk inputs)
    smoking_status          VARCHAR(20)     CHECK (smoking_status IN (
                                                'never', 'former', 'light', 'moderate', 'heavy', 'unknown'
                                            )),
    alcohol_use             VARCHAR(20)     CHECK (alcohol_use IN (
                                                'none', 'social', 'moderate', 'heavy', 'unknown'
                                            )),
    exercise_frequency      VARCHAR(20)     CHECK (exercise_frequency IN (
                                                'none', 'rarely', 'weekly', 'daily', 'unknown'
                                            )),

    -- Free text context
    notes                   TEXT,

    -- Who recorded it
    recorded_by             INT             REFERENCES users (id)
                                            ON DELETE SET NULL
                                            ON UPDATE CASCADE,
    recorded_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Timestamps
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for patient_history
CREATE INDEX idx_patient_history_patient_id    ON patient_history (patient_id);
CREATE INDEX idx_patient_history_recorded_by   ON patient_history (recorded_by);
CREATE INDEX idx_patient_history_is_ongoing    ON patient_history (is_ongoing);
CREATE INDEX idx_patient_history_severity      ON patient_history (severity);
CREATE INDEX idx_patient_history_start_date    ON patient_history (start_date DESC);
CREATE INDEX idx_patient_history_recorded_at   ON patient_history (recorded_at DESC);
-- Composite: AI reads all active history for a patient
CREATE INDEX idx_patient_history_patient_date  ON patient_history (patient_id, recorded_at DESC);
-- GIN index for full-text / array search on symptoms (AI feature extraction)
CREATE INDEX idx_patient_history_symptoms_gin  ON patient_history USING GIN (symptoms);
CREATE INDEX idx_patient_history_conditions_gin ON patient_history USING GIN (chronic_conditions);
CREATE INDEX idx_patient_history_medications_gin ON patient_history USING GIN (current_medications);
CREATE INDEX idx_patient_history_allergies_gin  ON patient_history USING GIN (allergies);

COMMENT ON TABLE  patient_history                    IS 'THE PRIMARY AI INPUT TABLE. Longitudinal medical history per patient for risk prediction and diagnostic AI.';
COMMENT ON COLUMN patient_history.symptoms           IS 'PostgreSQL text array of symptom strings; GIN-indexed for fast AI feature extraction.';
COMMENT ON COLUMN patient_history.chronic_conditions IS 'Known long-term conditions at time of recording; GIN-indexed for AI comorbidity analysis.';
COMMENT ON COLUMN patient_history.current_medications IS 'Active medications at time of recording; used by AI for drug interaction risk.';
COMMENT ON COLUMN patient_history.smoking_status     IS 'AI lifestyle risk factor: never | former | light | moderate | heavy | unknown.';
COMMENT ON COLUMN patient_history.is_ongoing         IS 'TRUE = active episode; FALSE = historical. AI filters active episodes for current risk.';


-- =============================================================================
-- SECTION 5: AI TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: ai_predictions
-- Purpose: Persistent store of every AI prediction result. Enables audit,
--          model performance tracking, and retrospective accuracy analysis.
-- -----------------------------------------------------------------------------
CREATE TABLE ai_predictions (
    id                  SERIAL          PRIMARY KEY,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE RESTRICT
                                        ON UPDATE CASCADE,

    -- Prediction metadata
    prediction_type     VARCHAR(100)    NOT NULL
                                        CHECK (prediction_type IN (
                                            'disease_risk', 'readmission_risk', 'medication_interaction',
                                            'symptom_analysis', 'treatment_recommendation',
                                            'vitals_anomaly', 'chronic_progression', 'custom'
                                        )),

    -- I/O payloads (JSONB for flexible schema evolution)
    input_data          JSONB           NOT NULL,    -- Raw features sent to AI model
    result_data         JSONB           NOT NULL,    -- Full model output including probabilities

    -- Risk summary (denormalized for fast querying without JSONB parsing)
    risk_level          VARCHAR(20)     NOT NULL DEFAULT 'unknown'
                                        CHECK (risk_level IN ('low', 'moderate', 'high', 'critical', 'unknown')),
    confidence          NUMERIC(5, 4)   NOT NULL DEFAULT 0
                                        CHECK (confidence >= 0 AND confidence <= 1),   -- 0.0000 – 1.0000

    -- AI service context
    ai_service_status   VARCHAR(20)     NOT NULL DEFAULT 'success'
                                        CHECK (ai_service_status IN ('success', 'partial', 'failed', 'timeout', 'degraded')),
    model_version       VARCHAR(50)     NOT NULL,    -- e.g. 'medsmart-v2.1.0'
    model_endpoint      VARCHAR(255),               -- Which FastAPI endpoint served this
    latency_ms          INT             CHECK (latency_ms >= 0),  -- Response time in milliseconds

    -- Reviewed by a doctor?
    reviewed_by         INT             REFERENCES doctors (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,
    reviewed_at         TIMESTAMPTZ,
    doctor_notes        TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for ai_predictions
CREATE INDEX idx_ai_predictions_patient_id       ON ai_predictions (patient_id);
CREATE INDEX idx_ai_predictions_prediction_type  ON ai_predictions (prediction_type);
CREATE INDEX idx_ai_predictions_risk_level        ON ai_predictions (risk_level);
CREATE INDEX idx_ai_predictions_ai_service_status ON ai_predictions (ai_service_status);
CREATE INDEX idx_ai_predictions_model_version     ON ai_predictions (model_version);
CREATE INDEX idx_ai_predictions_created_at        ON ai_predictions (created_at DESC);
CREATE INDEX idx_ai_predictions_reviewed_by       ON ai_predictions (reviewed_by);
-- Composite: dashboard — high-risk unreviewed predictions
CREATE INDEX idx_ai_predictions_risk_unreviewed   ON ai_predictions (risk_level, reviewed_by)
    WHERE reviewed_by IS NULL;
-- GIN index for querying inside JSONB result payloads
CREATE INDEX idx_ai_predictions_result_gin        ON ai_predictions USING GIN (result_data);
CREATE INDEX idx_ai_predictions_input_gin         ON ai_predictions USING GIN (input_data);

COMMENT ON TABLE  ai_predictions                  IS 'Immutable log of every AI prediction result with I/O payloads for audit and model evaluation.';
COMMENT ON COLUMN ai_predictions.confidence       IS 'Model confidence score 0.0–1.0; stored as NUMERIC(5,4) for precision.';
COMMENT ON COLUMN ai_predictions.input_data       IS 'JSONB snapshot of features sent to AI; preserved for model retraining pipelines.';
COMMENT ON COLUMN ai_predictions.result_data      IS 'Full JSONB model output; GIN-indexed to allow querying specific prediction fields.';


-- -----------------------------------------------------------------------------
-- TABLE: ai_logs
-- Purpose: Low-level request/response logs for every AI service call,
--          including errors, for debugging and SLA monitoring.
-- -----------------------------------------------------------------------------
CREATE TABLE ai_logs (
    id                  SERIAL          PRIMARY KEY,

    prediction_id       INT             REFERENCES ai_predictions (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    patient_id          INT             REFERENCES patients (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Request context
    endpoint            VARCHAR(255)    NOT NULL,   -- e.g. '/api/v1/predict/disease-risk'
    http_method         VARCHAR(10)     NOT NULL DEFAULT 'POST'
                                        CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    request_payload     JSONB,
    response_payload    JSONB,

    -- Result
    status_code         INT             NOT NULL CHECK (status_code BETWEEN 100 AND 599),
    error_message       TEXT,           -- NULL on success
    error_code          VARCHAR(50),    -- Application-level error code

    -- Performance
    latency_ms          INT             NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
    model_version       VARCHAR(50),
    ai_server_instance  VARCHAR(100),   -- Hostname/pod for multi-node deployments

    -- Actor
    triggered_by        INT             REFERENCES users (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for ai_logs
CREATE INDEX idx_ai_logs_prediction_id   ON ai_logs (prediction_id);
CREATE INDEX idx_ai_logs_patient_id      ON ai_logs (patient_id);
CREATE INDEX idx_ai_logs_endpoint        ON ai_logs (endpoint);
CREATE INDEX idx_ai_logs_status_code     ON ai_logs (status_code);
CREATE INDEX idx_ai_logs_latency_ms      ON ai_logs (latency_ms DESC);
CREATE INDEX idx_ai_logs_created_at      ON ai_logs (created_at DESC);
-- Partial index: errors only (debugging queries)
CREATE INDEX idx_ai_logs_errors          ON ai_logs (created_at DESC, status_code)
    WHERE status_code >= 400;

COMMENT ON TABLE  ai_logs                   IS 'Low-level AI service call logs for debugging, SLA monitoring, and error analysis.';
COMMENT ON COLUMN ai_logs.error_code        IS 'Application-level error code (e.g. AI_TIMEOUT, MODEL_NOT_FOUND) for programmatic handling.';
COMMENT ON COLUMN ai_logs.ai_server_instance IS 'Pod/hostname serving the request; useful for diagnosing node-specific issues in k8s.';


-- -----------------------------------------------------------------------------
-- TABLE: risk_scores
-- Purpose: Aggregated, periodically-computed risk scores per patient per
--          category. Acts as a materialized risk dashboard read by the UI
--          without running real-time AI on every page load.
-- -----------------------------------------------------------------------------
CREATE TABLE risk_scores (
    id                  SERIAL          PRIMARY KEY,

    patient_id          INT             NOT NULL
                                        REFERENCES patients (id)
                                        ON DELETE CASCADE
                                        ON UPDATE CASCADE,

    -- Score definition
    risk_category       VARCHAR(100)    NOT NULL
                                        CHECK (risk_category IN (
                                            'cardiovascular', 'diabetes', 'respiratory',
                                            'mental_health', 'cancer', 'readmission',
                                            'fall_risk', 'medication_adherence', 'overall', 'custom'
                                        )),

    -- Score values
    score               NUMERIC(5, 4)   NOT NULL CHECK (score >= 0 AND score <= 1),  -- 0.0 – 1.0
    risk_level          VARCHAR(20)     NOT NULL
                                        CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    score_breakdown     JSONB,          -- Contributing factors from AI model

    -- Source
    based_on_prediction_id  INT         REFERENCES ai_predictions (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,
    model_version       VARCHAR(50)     NOT NULL,
    computed_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMPTZ,    -- Cache expiry; NULL = always recompute

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for risk_scores
CREATE INDEX idx_risk_scores_patient_id        ON risk_scores (patient_id);
CREATE INDEX idx_risk_scores_risk_category     ON risk_scores (risk_category);
CREATE INDEX idx_risk_scores_risk_level        ON risk_scores (risk_level);
CREATE INDEX idx_risk_scores_computed_at       ON risk_scores (computed_at DESC);
CREATE INDEX idx_risk_scores_based_on_pred     ON risk_scores (based_on_prediction_id);
-- Composite: dashboard — latest score per patient per category
CREATE INDEX idx_risk_scores_patient_category  ON risk_scores (patient_id, risk_category, computed_at DESC);
-- Partial index: high/critical risk for alert dashboard
CREATE INDEX idx_risk_scores_high_critical     ON risk_scores (risk_level, patient_id, computed_at DESC)
    WHERE risk_level IN ('high', 'critical');

COMMENT ON TABLE  risk_scores                      IS 'Aggregated AI-computed risk scores per patient per category for UI dashboards.';
COMMENT ON COLUMN risk_scores.score                IS 'Normalized risk score 0.0 (no risk) – 1.0 (maximum risk).';
COMMENT ON COLUMN risk_scores.score_breakdown      IS 'JSONB of contributing features and weights from the AI model.';
COMMENT ON COLUMN risk_scores.valid_until          IS 'NULL means score must be recomputed on next request; set a TTL for caching.';


-- =============================================================================
-- SECTION 6: SYSTEM TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: notifications
-- Purpose: Centralized notification queue for in-app, SMS, email, and push
--          notifications targeting users (doctors, patients, admins).
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id                  SERIAL          PRIMARY KEY,

    recipient_id        INT             NOT NULL
                                        REFERENCES users (id)
                                        ON DELETE CASCADE
                                        ON UPDATE CASCADE,

    -- Optional relational context
    sender_id           INT             REFERENCES users (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,

    -- Content
    title               VARCHAR(255)    NOT NULL,
    body                TEXT            NOT NULL,
    action_url          TEXT,           -- Deep link or route for the frontend

    -- Categorization
    notification_type   VARCHAR(50)     NOT NULL
                                        CHECK (notification_type IN (
                                            'appointment_reminder', 'appointment_update',
                                            'lab_result', 'prescription', 'payment',
                                            'ai_alert', 'system', 'message', 'emergency'
                                        )),
    channel             VARCHAR(30)     NOT NULL DEFAULT 'in_app'
                                        CHECK (channel IN ('in_app', 'email', 'sms', 'push', 'whatsapp')),
    priority            VARCHAR(10)     NOT NULL DEFAULT 'normal'
                                        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Reference entities (polymorphic via JSONB)
    entity_type         VARCHAR(50),    -- e.g. 'appointment', 'payment', 'ai_prediction'
    entity_id           INT,            -- PK of the referenced entity

    -- State
    is_read             BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    is_sent             BOOLEAN         NOT NULL DEFAULT FALSE,
    sent_at             TIMESTAMPTZ,
    delivery_status     VARCHAR(20)     NOT NULL DEFAULT 'pending'
                                        CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    failure_reason      TEXT,

    -- Scheduling
    scheduled_send_at   TIMESTAMPTZ,   -- NULL = send immediately

    -- Timestamps
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_recipient_id      ON notifications (recipient_id);
CREATE INDEX idx_notifications_sender_id         ON notifications (sender_id);
CREATE INDEX idx_notifications_notification_type ON notifications (notification_type);
CREATE INDEX idx_notifications_channel           ON notifications (channel);
CREATE INDEX idx_notifications_priority          ON notifications (priority);
CREATE INDEX idx_notifications_delivery_status   ON notifications (delivery_status);
CREATE INDEX idx_notifications_created_at        ON notifications (created_at DESC);
-- Partial index: unread notifications (common inbox query)
CREATE INDEX idx_notifications_unread            ON notifications (recipient_id, created_at DESC)
    WHERE is_read = FALSE;
-- Partial index: failed deliveries for retry queue
CREATE INDEX idx_notifications_failed            ON notifications (delivery_status, scheduled_send_at)
    WHERE delivery_status = 'failed';

COMMENT ON TABLE  notifications                       IS 'Centralized multi-channel notification queue for all system actors.';
COMMENT ON COLUMN notifications.entity_type           IS 'Polymorphic reference: identifies which table entity_id points to.';
COMMENT ON COLUMN notifications.scheduled_send_at     IS 'NULL = immediate; set a future timestamp for scheduled reminders.';


-- -----------------------------------------------------------------------------
-- TABLE: audit_logs
-- Purpose: Immutable, append-only security audit trail of every sensitive
--          action in the system. Required for HIPAA/GDPR compliance.
--          NEVER update or delete rows in this table.
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id                  SERIAL          PRIMARY KEY,

    -- Actor
    actor_id            INT             REFERENCES users (id)
                                        ON DELETE SET NULL
                                        ON UPDATE CASCADE,
    actor_role          VARCHAR(30),    -- Snapshot at time of action (role may change later)
    actor_ip            VARCHAR(45),
    actor_user_agent    TEXT,

    -- Action
    action              VARCHAR(100)    NOT NULL,   -- e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
    action_category     VARCHAR(50)     NOT NULL
                                        CHECK (action_category IN (
                                            'auth', 'patient_data', 'medical_record',
                                            'ai_access', 'payment', 'admin', 'system', 'export'
                                        )),

    -- Target entity
    entity_type         VARCHAR(100)    NOT NULL,   -- e.g. 'patient_history', 'appointments'
    entity_id           INT,                        -- PK of the affected row
    entity_snapshot     JSONB,                      -- Serialized state BEFORE the change (for diffs)

    -- Change detail
    changed_fields      JSONB,          -- e.g. {"status": {"old": "scheduled", "new": "cancelled"}}
    description         TEXT,           -- Human-readable summary

    -- Result
    success             BOOLEAN         NOT NULL DEFAULT TRUE,
    error_message       TEXT,

    -- Session context
    session_id          VARCHAR(255),   -- JWT jti or session UUID
    request_id          VARCHAR(255),   -- Trace ID for distributed logging

    -- Timestamps (created_at only — this table is append-only)
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_actor_id        ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action          ON audit_logs (action);
CREATE INDEX idx_audit_logs_action_category ON audit_logs (action_category);
CREATE INDEX idx_audit_logs_entity_type     ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id       ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_success         ON audit_logs (success);
CREATE INDEX idx_audit_logs_created_at      ON audit_logs (created_at DESC);
-- Composite: compliance queries — all actions on a specific record
CREATE INDEX idx_audit_logs_entity_lookup   ON audit_logs (entity_type, entity_id, created_at DESC);
-- Composite: security — all actions by a specific user
CREATE INDEX idx_audit_logs_actor_actions   ON audit_logs (actor_id, created_at DESC);

COMMENT ON TABLE  audit_logs                     IS 'Append-only HIPAA/GDPR compliance audit trail. Never UPDATE or DELETE rows.';
COMMENT ON COLUMN audit_logs.entity_snapshot     IS 'JSONB snapshot of the row BEFORE mutation; enables full change-diff reconstruction.';
COMMENT ON COLUMN audit_logs.changed_fields      IS 'JSONB diff of {field: {old, new}} for UPDATE operations.';
COMMENT ON COLUMN audit_logs.actor_role          IS 'Snapshot of actor role at time of action (de-normalized to survive role changes).';


-- =============================================================================
-- AUTO-UPDATE TRIGGERS FOR updated_at
-- Purpose: Automatically maintain updated_at on every UPDATE without
--          requiring application-level logic.
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every table
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON diagnoses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON vital_signs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON patient_history
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_logs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON risk_scores
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
