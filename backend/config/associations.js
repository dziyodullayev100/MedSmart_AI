const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const Diagnosis = require('../models/Diagnosis');
const PatientHistory = require('../models/PatientHistory');
const VitalSigns = require('../models/VitalSigns');
const AIPrediction = require('../models/AIPrediction');

// Setup model associations
const setupAssociations = () => {
    // Doctor associations
    Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
    Doctor.hasMany(Diagnosis, { foreignKey: 'doctorId' });

    // Patient associations
    Patient.hasMany(Appointment, { foreignKey: 'patientId' });
    Patient.hasMany(Diagnosis, { foreignKey: 'patientId' });
    Patient.hasMany(PatientHistory, { foreignKey: 'patientId' });
    Patient.hasMany(VitalSigns, { foreignKey: 'patientId' });
    Patient.hasMany(AIPrediction, { foreignKey: 'patientId' });

    // Service associations
    Service.hasMany(Appointment, { foreignKey: 'serviceId' });

    // Appointment associations
    Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'Doctor' });
    Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'Patient' });
    Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'Service' });
    Appointment.hasOne(Payment, { foreignKey: 'appointmentId' });
    Appointment.hasMany(Diagnosis, { foreignKey: 'appointmentId' });
    Appointment.hasMany(VitalSigns, { foreignKey: 'appointmentId' });

    // Payment associations
    Payment.belongsTo(Appointment, { foreignKey: 'appointmentId' });
    Payment.belongsTo(Patient, { foreignKey: 'patientId' });

    // Diagnosis associations
    Diagnosis.belongsTo(Patient, { foreignKey: 'patientId' });
    Diagnosis.belongsTo(Doctor, { foreignKey: 'doctorId' });
    Diagnosis.belongsTo(Appointment, { foreignKey: 'appointmentId' });

    // PatientHistory associations
    PatientHistory.belongsTo(Patient, { foreignKey: 'patientId' });

    // VitalSigns associations
    VitalSigns.belongsTo(Patient, { foreignKey: 'patientId' });
    VitalSigns.belongsTo(Appointment, { foreignKey: 'appointmentId' });

    // AIPrediction associations
    AIPrediction.belongsTo(Patient, { foreignKey: 'patientId' });
};

module.exports = { setupAssociations };
