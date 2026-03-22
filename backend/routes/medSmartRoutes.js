const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/medSmartController');

// ─── Doctor routes ────────────────────────────────────────
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// ─── Patient routes ───────────────────────────────────────
router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientById);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

// ─── Appointment routes ───────────────────────────────────
router.get('/appointments', getAllAppointments);
router.get('/appointments/:id', getAppointmentById);
router.post('/appointments', createAppointment);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);
router.put('/appointments/:id/status', updateAppointmentStatus);

// ─── Service routes ───────────────────────────────────────
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);
router.post('/services', createService);

// ─── Payment routes ───────────────────────────────────────
router.get('/payments', getAllPayments);
router.get('/payments/:id', getPaymentById);
router.post('/payments', createPayment);
router.put('/payments/:id/status', updatePaymentStatus);

// ─── Diagnosis routes (AI Data Collection) ───────────────
router.get('/diagnoses', getAllDiagnoses);
router.get('/diagnoses/patient/:patientId', getDiagnosesByPatient);
router.get('/diagnoses/:id', getDiagnosisById);
router.post('/diagnoses', createDiagnosis);
router.put('/diagnoses/:id', updateDiagnosis);
router.delete('/diagnoses/:id', deleteDiagnosis);

// ─── Patient History routes (AI Data Collection) ─────────
router.get('/history/patient/:patientId', getPatientHistory);
router.get('/history/:id', getPatientHistoryById);
router.post('/history', createPatientHistory);
router.put('/history/:id', updatePatientHistory);
router.delete('/history/:id', deletePatientHistory);

// ─── Vital Signs routes (AI Data Collection) ─────────────
router.get('/vitals/patient/:patientId', getVitalSigns);
router.get('/vitals/:id', getVitalSignsById);
router.post('/vitals', createVitalSigns);
router.put('/vitals/:id', updateVitalSigns);
router.delete('/vitals/:id', deleteVitalSigns);

module.exports = router;
