const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const Diagnosis = require('../models/Diagnosis');
const PatientHistory = require('../models/PatientHistory');
const VitalSigns = require('../models/VitalSigns');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────
// DOCTOR CRUD
// ─────────────────────────────────────────────────────────

const getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(doctors);
    } catch (error) {
        next(error);
    }
};

const getDoctorById = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        next(error);
    }
};

const createDoctor = async (req, res, next) => {
    try {
        const { name, email, password, specialization, experience, phone, schedule } = req.body;
        const doctor = await Doctor.create({
            name, email, password,
            specialization, experience, phone, schedule
        });
        res.status(201).json({
            id: doctor.id, name: doctor.name, email: doctor.email,
            specialization: doctor.specialization, experience: doctor.experience,
            phone: doctor.phone, schedule: doctor.schedule
        });
    } catch (error) {
        next(error);
    }
};

const updateDoctor = async (req, res, next) => {
    try {
        const { name, email, password, specialization, experience, phone, schedule } = req.body;
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        if (name) doctor.name = name;
        if (email) doctor.email = email;
        if (specialization) doctor.specialization = specialization;
        if (experience) doctor.experience = experience;
        if (phone) doctor.phone = phone;
        if (schedule) doctor.schedule = schedule;
        if (password) doctor.password = password;
        await doctor.save();
        res.json({
            id: doctor.id, name: doctor.name, email: doctor.email,
            specialization: doctor.specialization, experience: doctor.experience,
            phone: doctor.phone, schedule: doctor.schedule
        });
    } catch (error) {
        next(error);
    }
};

const deleteDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        await doctor.destroy();
        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// PATIENT CRUD
// ─────────────────────────────────────────────────────────

const getAllPatients = async (req, res, next) => {
    try {
        const patients = await Patient.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(patients);
    } catch (error) {
        next(error);
    }
};

const getPatientById = async (req, res, next) => {
    try {
        const patient = await Patient.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    } catch (error) {
        next(error);
    }
};

const createPatient = async (req, res, next) => {
    try {
        const { name, email, password, phone, dateOfBirth, address, medicalHistory } = req.body;
        const patient = await Patient.create({
            name, email, password,
            phone, dateOfBirth, address, medicalHistory
        });
        res.status(201).json({
            id: patient.id, name: patient.name, email: patient.email,
            phone: patient.phone, dateOfBirth: patient.dateOfBirth,
            address: patient.address, medicalHistory: patient.medicalHistory
        });
    } catch (error) {
        next(error);
    }
};

const updatePatient = async (req, res, next) => {
    try {
        const { name, email, password, phone, dateOfBirth, address, medicalHistory } = req.body;
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        if (name) patient.name = name;
        if (email) patient.email = email;
        if (phone) patient.phone = phone;
        if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
        if (address) patient.address = address;
        if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
        if (password) patient.password = password;
        await patient.save();
        res.json({
            id: patient.id, name: patient.name, email: patient.email,
            phone: patient.phone, dateOfBirth: patient.dateOfBirth,
            address: patient.address, medicalHistory: patient.medicalHistory
        });
    } catch (error) {
        next(error);
    }
};

const deletePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        await patient.destroy();
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// APPOINTMENT CRUD
// ─────────────────────────────────────────────────────────

const getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
                { model: Patient, as: 'patient', attributes: ['id', 'name'] },
                { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
            ]
        });
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};

const getAppointmentById = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
                { model: Patient, as: 'patient', attributes: ['id', 'name'] },
                { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
            ]
        });
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

const createAppointment = async (req, res, next) => {
    try {
        const { patientId, doctorId, date, time, notes, serviceId } = req.body;
        const appointment = await Appointment.create({
            patientId, doctorId, appointmentDate: date, appointmentTime: time, notes, serviceId
        });
        res.status(201).json(appointment);
    } catch (error) {
        next(error);
    }
};

const updateAppointment = async (req, res, next) => {
    try {
        const { patientId, doctorId, date, time, notes, serviceId } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (patientId) appointment.patientId = patientId;
        if (doctorId) appointment.doctorId = doctorId;
        if (date) appointment.appointmentDate = date;
        if (time) appointment.appointmentTime = time;
        if (notes !== undefined) appointment.notes = notes;
        if (serviceId) appointment.serviceId = serviceId;
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

const deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        await appointment.destroy();
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        appointment.status = status;
        await appointment.save();
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// SERVICE CRUD
// ─────────────────────────────────────────────────────────

const getAllServices = async (req, res, next) => {
    try {
        const services = await Service.findAll({ where: { isActive: true } });
        res.json(services);
    } catch (error) {
        next(error);
    }
};

const getServiceById = async (req, res, next) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
    } catch (error) {
        next(error);
    }
};

const createService = async (req, res, next) => {
    try {
        const { name, description, price, duration, category } = req.body;
        const service = await Service.create({ name, description, price, duration, category });
        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// PAYMENT CRUD
// ─────────────────────────────────────────────────────────

const getAllPayments = async (req, res, next) => {
    try {
        const payments = await Payment.findAll({
            include: [
                { model: Appointment },
                { model: Patient, attributes: ['id', 'name'] }
            ]
        });
        res.json(payments);
    } catch (error) {
        next(error);
    }
};

const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                { model: Appointment },
                { model: Patient, attributes: ['id', 'name'] }
            ]
        });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        next(error);
    }
};

const createPayment = async (req, res, next) => {
    try {
        const { amount, paymentMethod, status, receiptId, appointmentId, patientId, paymentDate } = req.body;
        const payment = await Payment.create({
            amount, paymentMethod, status, receiptId,
            appointmentId, patientId, paymentDate
        });
        res.status(201).json(payment);
    } catch (error) {
        next(error);
    }
};

const updatePaymentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        payment.status = status;
        await payment.save();
        res.json(payment);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// DIAGNOSIS CRUD  (AI Data Collection)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/diagnoses
 * Returns all diagnoses with patient + doctor info
 */
const getAllDiagnoses = async (req, res, next) => {
    try {
        const diagnoses = await Diagnosis.findAll({
            include: [
                { model: Patient, attributes: ['id', 'name', 'dateOfBirth'] },
                { model: Doctor, attributes: ['id', 'name', 'specialization'] },
                { model: Appointment, attributes: ['id', 'date', 'time'] }
            ],
            order: [['dateDiagnosed', 'DESC']]
        });
        res.json(diagnoses);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/diagnoses/patient/:patientId
 * Returns all diagnoses for a specific patient, ordered by date
 */
const getDiagnosesByPatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const diagnoses = await Diagnosis.findAll({
            where: { patientId },
            include: [
                { model: Doctor, attributes: ['id', 'name', 'specialization'] },
                { model: Appointment, attributes: ['id', 'date', 'time'] }
            ],
            order: [['dateDiagnosed', 'DESC']]
        });
        res.json(diagnoses);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/diagnoses/:id
 * Returns a single diagnosis by ID
 */
const getDiagnosisById = async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findByPk(req.params.id, {
            include: [
                { model: Patient, attributes: ['id', 'name'] },
                { model: Doctor, attributes: ['id', 'name', 'specialization'] },
                { model: Appointment, attributes: ['id', 'date', 'time'] }
            ]
        });
        if (!diagnosis) return res.status(404).json({ message: 'Diagnosis not found' });
        res.json(diagnosis);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/diagnoses
 * Create a new diagnosis — dateDiagnosed auto-set to NOW if not provided
 */
const createDiagnosis = async (req, res, next) => {
    try {
        const {
            patientId, doctorId, appointmentId,
            condition, symptoms, severity, notes, status,
            dateDiagnosed
        } = req.body;

        if (!patientId || !doctorId || !condition) {
            return res.status(400).json({ message: 'patientId, doctorId, and condition are required' });
        }

        const diagnosis = await Diagnosis.create({
            patientId,
            doctorId,
            appointmentId: appointmentId || null,
            condition,
            symptoms: symptoms || [],
            severity: severity || 'mild',
            notes: notes || null,
            status: status || 'active',
            dateDiagnosed: dateDiagnosed ? new Date(dateDiagnosed) : new Date()
        });

        res.status(201).json(diagnosis);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/diagnoses/:id
 * Update an existing diagnosis
 */
const updateDiagnosis = async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findByPk(req.params.id);
        if (!diagnosis) return res.status(404).json({ message: 'Diagnosis not found' });

        const { condition, symptoms, severity, notes, status, dateDiagnosed, appointmentId } = req.body;
        if (condition) diagnosis.condition = condition;
        if (symptoms !== undefined) diagnosis.symptoms = symptoms;
        if (severity) diagnosis.severity = severity;
        if (notes !== undefined) diagnosis.notes = notes;
        if (status) diagnosis.status = status;
        if (dateDiagnosed) diagnosis.dateDiagnosed = new Date(dateDiagnosed);
        if (appointmentId !== undefined) diagnosis.appointmentId = appointmentId;

        await diagnosis.save();
        res.json(diagnosis);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/diagnoses/:id
 */
const deleteDiagnosis = async (req, res, next) => {
    try {
        const diagnosis = await Diagnosis.findByPk(req.params.id);
        if (!diagnosis) return res.status(404).json({ message: 'Diagnosis not found' });
        await diagnosis.destroy();
        res.json({ message: 'Diagnosis deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// PATIENT HISTORY CRUD  (AI Data Collection)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/history/patient/:patientId
 * Returns all history entries for a patient, ordered by recordedAt DESC
 */
const getPatientHistory = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const history = await PatientHistory.findAll({
            where: { patientId },
            order: [['recordedAt', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/history/:id
 */
const getPatientHistoryById = async (req, res, next) => {
    try {
        const entry = await PatientHistory.findByPk(req.params.id, {
            include: [{ model: Patient, attributes: ['id', 'name'] }]
        });
        if (!entry) return res.status(404).json({ message: 'Patient history not found' });
        res.json(entry);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/history
 * Create a patient history entry — recordedAt auto-set to NOW
 */
const createPatientHistory = async (req, res, next) => {
    try {
        const {
            patientId, pastConditions, chronicConditions,
            surgeries, allergies, medications, familyHistory, recordedAt
        } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }

        const entry = await PatientHistory.create({
            patientId,
            pastConditions: pastConditions || null,
            chronicConditions: chronicConditions || [],
            surgeries: surgeries || null,
            allergies: allergies || null,
            medications: medications || [],
            familyHistory: familyHistory || null,
            recordedAt: recordedAt ? new Date(recordedAt) : new Date()
        });

        res.status(201).json(entry);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/history/:id
 */
const updatePatientHistory = async (req, res, next) => {
    try {
        const entry = await PatientHistory.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Patient history not found' });

        const {
            pastConditions, chronicConditions, surgeries,
            allergies, medications, familyHistory, recordedAt
        } = req.body;

        if (pastConditions !== undefined) entry.pastConditions = pastConditions;
        if (chronicConditions !== undefined) entry.chronicConditions = chronicConditions;
        if (surgeries !== undefined) entry.surgeries = surgeries;
        if (allergies !== undefined) entry.allergies = allergies;
        if (medications !== undefined) entry.medications = medications;
        if (familyHistory !== undefined) entry.familyHistory = familyHistory;
        if (recordedAt) entry.recordedAt = new Date(recordedAt);

        await entry.save();
        res.json(entry);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/history/:id
 */
const deletePatientHistory = async (req, res, next) => {
    try {
        const entry = await PatientHistory.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Patient history not found' });
        await entry.destroy();
        res.json({ message: 'Patient history deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// VITAL SIGNS CRUD  (AI Data Collection)
// ─────────────────────────────────────────────────────────

/**
 * GET /api/vitals/patient/:patientId
 * Returns all vital sign records for a patient, ordered by recordedAt DESC
 */
const getVitalSigns = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const vitals = await VitalSigns.findAll({
            where: { patientId },
            include: [
                { model: Appointment, attributes: ['id', 'date', 'time'] }
            ],
            order: [['recordedAt', 'DESC']]
        });
        res.json(vitals);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/vitals/:id
 */
const getVitalSignsById = async (req, res, next) => {
    try {
        const vital = await VitalSigns.findByPk(req.params.id, {
            include: [{ model: Patient, attributes: ['id', 'name'] }]
        });
        if (!vital) return res.status(404).json({ message: 'Vital signs record not found' });
        res.json(vital);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/vitals
 * Create a vital signs record — recordedAt auto-set to NOW
 */
const createVitalSigns = async (req, res, next) => {
    try {
        const {
            patientId, appointmentId,
            height, weight, bloodPressure, heartRate,
            temperature, oxygenSaturation, recordedAt
        } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }

        const vital = await VitalSigns.create({
            patientId,
            appointmentId: appointmentId || null,
            height: height || null,
            weight: weight || null,
            bloodPressure: bloodPressure || null,
            heartRate: heartRate || null,
            temperature: temperature || null,
            oxygenSaturation: oxygenSaturation || null,
            recordedAt: recordedAt ? new Date(recordedAt) : new Date()
        });

        res.status(201).json(vital);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/vitals/:id
 */
const updateVitalSigns = async (req, res, next) => {
    try {
        const vital = await VitalSigns.findByPk(req.params.id);
        if (!vital) return res.status(404).json({ message: 'Vital signs record not found' });

        const {
            height, weight, bloodPressure, heartRate,
            temperature, oxygenSaturation, recordedAt, appointmentId
        } = req.body;

        if (height !== undefined) vital.height = height;
        if (weight !== undefined) vital.weight = weight;
        if (bloodPressure !== undefined) vital.bloodPressure = bloodPressure;
        if (heartRate !== undefined) vital.heartRate = heartRate;
        if (temperature !== undefined) vital.temperature = temperature;
        if (oxygenSaturation !== undefined) vital.oxygenSaturation = oxygenSaturation;
        if (recordedAt) vital.recordedAt = new Date(recordedAt);
        if (appointmentId !== undefined) vital.appointmentId = appointmentId;

        await vital.save();
        res.json(vital);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/vitals/:id
 */
const deleteVitalSigns = async (req, res, next) => {
    try {
        const vital = await VitalSigns.findByPk(req.params.id);
        if (!vital) return res.status(404).json({ message: 'Vital signs record not found' });
        await vital.destroy();
        res.json({ message: 'Vital signs record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────

module.exports = {
    // Doctors
    getAllDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor,
    // Patients
    getAllPatients, getPatientById, createPatient, updatePatient, deletePatient,
    // Appointments
    getAllAppointments, getAppointmentById, createAppointment,
    updateAppointment, deleteAppointment, updateAppointmentStatus,
    // Services
    getAllServices, getServiceById, createService,
    // Payments
    getAllPayments, getPaymentById, createPayment, updatePaymentStatus,
    // Diagnoses (AI Data)
    getAllDiagnoses, getDiagnosesByPatient, getDiagnosisById,
    createDiagnosis, updateDiagnosis, deleteDiagnosis,
    // Patient History (AI Data)
    getPatientHistory, getPatientHistoryById,
    createPatientHistory, updatePatientHistory, deletePatientHistory,
    // Vital Signs (AI Data)
    getVitalSigns, getVitalSignsById,
    createVitalSigns, updateVitalSigns, deleteVitalSigns
};
