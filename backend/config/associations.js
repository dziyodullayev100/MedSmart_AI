/**
 * associations.js — Module E: Complete Model Relationships
 * All 15 tables, all relationships with named aliases.
 */
const User          = require('../models/User');
const RefreshToken  = require('../models/RefreshToken');
const Doctor        = require('../models/Doctor');
const Patient       = require('../models/Patient');
const Service       = require('../models/Service');
const Appointment   = require('../models/Appointment');
const Payment       = require('../models/Payment');
const Diagnosis     = require('../models/Diagnosis');
const VitalSigns    = require('../models/VitalSigns');
const PatientHistory = require('../models/PatientHistory');
const AIPrediction  = require('../models/AIPrediction');
const AILog         = require('../models/AILog');
const RiskScore     = require('../models/RiskScore');
const Notification  = require('../models/Notification');
const AuditLog      = require('../models/AuditLog');

const setupAssociations = () => {

    // ── Patient (hub of clinical data) ────────────────────────────────────────
    Patient.hasMany(Appointment,    { foreignKey: 'patientId', as: 'appointments',  onDelete: 'RESTRICT' });
    Patient.hasMany(Diagnosis,      { foreignKey: 'patientId', as: 'diagnoses',     onDelete: 'RESTRICT' });
    Patient.hasMany(VitalSigns,     { foreignKey: 'patientId', as: 'vitalSigns',    onDelete: 'RESTRICT' });
    Patient.hasMany(PatientHistory, { foreignKey: 'patientId', as: 'history',       onDelete: 'RESTRICT' });
    Patient.hasMany(Payment,        { foreignKey: 'patientId', as: 'payments',      onDelete: 'RESTRICT' });
    Patient.hasMany(AIPrediction,   { foreignKey: 'patientId', as: 'predictions',   onDelete: 'RESTRICT' });
    Patient.hasMany(AILog,          { foreignKey: 'patientId', as: 'aiLogs',        onDelete: 'SET NULL' });
    Patient.hasOne(RiskScore,       { foreignKey: 'patientId', as: 'riskScore',     onDelete: 'CASCADE' });

    // ── Doctor ─────────────────────────────────────────────────────────────────
    Doctor.hasMany(Appointment,     { foreignKey: 'doctorId',  as: 'appointments',  onDelete: 'RESTRICT' });
    Doctor.hasMany(Diagnosis,       { foreignKey: 'doctorId',  as: 'diagnoses',     onDelete: 'RESTRICT' });
    Doctor.hasMany(VitalSigns,      { foreignKey: 'doctorId',  as: 'vitalSigns',    onDelete: 'SET NULL' });

    // ── Service ────────────────────────────────────────────────────────────────
    Service.hasMany(Appointment,    { foreignKey: 'serviceId', as: 'appointments',  onDelete: 'SET NULL' });
    Service.hasMany(Payment,        { foreignKey: 'serviceId', as: 'payments',      onDelete: 'SET NULL' });

    // ── Appointment ────────────────────────────────────────────────────────────
    Appointment.belongsTo(Patient,  { foreignKey: 'patientId', as: 'patient' });
    Appointment.belongsTo(Doctor,   { foreignKey: 'doctorId',  as: 'doctor' });
    Appointment.belongsTo(Service,  { foreignKey: 'serviceId', as: 'service' });
    Appointment.hasOne(Payment,     { foreignKey: 'appointmentId', as: 'payment',   onDelete: 'RESTRICT' });
    Appointment.hasMany(Diagnosis,  { foreignKey: 'appointmentId', as: 'diagnoses', onDelete: 'SET NULL' });
    Appointment.hasMany(VitalSigns, { foreignKey: 'appointmentId', as: 'vitalSigns',onDelete: 'SET NULL' });

    // ── Payment ────────────────────────────────────────────────────────────────
    Payment.belongsTo(Appointment,  { foreignKey: 'appointmentId', as: 'appointment' });
    Payment.belongsTo(Patient,      { foreignKey: 'patientId',     as: 'patient' });
    Payment.belongsTo(Service,      { foreignKey: 'serviceId',     as: 'service' });

    // ── Diagnosis ──────────────────────────────────────────────────────────────
    Diagnosis.belongsTo(Patient,     { foreignKey: 'patientId',     as: 'patient' });
    Diagnosis.belongsTo(Doctor,      { foreignKey: 'doctorId',      as: 'doctor' });
    Diagnosis.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    // ── VitalSigns ─────────────────────────────────────────────────────────────
    VitalSigns.belongsTo(Patient,     { foreignKey: 'patientId',     as: 'patient' });
    VitalSigns.belongsTo(Doctor,      { foreignKey: 'doctorId',      as: 'doctor' });
    VitalSigns.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

    // ── PatientHistory ─────────────────────────────────────────────────────────
    PatientHistory.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

    // ── AIPrediction ───────────────────────────────────────────────────────────
    AIPrediction.belongsTo(Patient,   { foreignKey: 'patientId', as: 'patient' });

    // ── AILog ──────────────────────────────────────────────────────────────────
    AILog.belongsTo(Patient,          { foreignKey: 'patientId', as: 'patient' });

    // ── RiskScore ──────────────────────────────────────────────────────────────
    RiskScore.belongsTo(Patient,      { foreignKey: 'patientId', as: 'patient' });

    // ── User → RefreshToken ────────────────────────────────────────────────────
    // User.hasMany(RefreshToken,        { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
    // RefreshToken.belongsTo(User,      { foreignKey: 'userId', as: 'user' });
};

module.exports = {
    setupAssociations,
    models: {
        User, RefreshToken, Doctor, Patient, Service,
        Appointment, Payment, Diagnosis, VitalSigns,
        PatientHistory, AIPrediction, AILog, RiskScore,
        Notification, AuditLog
    }
};
