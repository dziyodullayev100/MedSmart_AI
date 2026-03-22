const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');

// Sync download - send all data to frontend
router.get('/download', async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            attributes: { exclude: ['password'] }
        });
        
        const patients = await Patient.findAll({
            attributes: { exclude: ['password'] }
        });
        
        const appointments = await Appointment.findAll({
            include: [
                { model: Doctor, as: 'Doctor', attributes: ['id', 'name', 'specialization'] },
                { model: Patient, as: 'Patient', attributes: ['id', 'name'] },
                { model: Service, as: 'Service', attributes: ['id', 'name', 'price'] }
            ]
        });
        
        const services = await Service.findAll({
            where: { isActive: true }
        });
        
        res.json({
            doctors,
            patients,
            appointments,
            services,
            lastSync: new Date().toISOString()
        });
    } catch (error) {
        console.error('Sync download error:', error);
        res.status(500).json({ 
            message: 'Sync failed',
            error: error.message 
        });
    }
});

// Sync upload - receive data from frontend
router.post('/upload', async (req, res) => {
    try {
        const { doctors, patients, appointments, services } = req.body;
        
        // Process doctors
        if (doctors && doctors.length > 0) {
            for (const doctorData of doctors) {
                if (doctorData.id) {
                    await Doctor.upsert(doctorData, {
                        returning: true
                    });
                }
            }
        }
        
        // Process patients
        if (patients && patients.length > 0) {
            for (const patientData of patients) {
                if (patientData.id) {
                    await Patient.upsert(patientData, {
                        returning: true
                    });
                }
            }
        }
        
        // Process appointments
        if (appointments && appointments.length > 0) {
            for (const appointmentData of appointments) {
                if (appointmentData.id) {
                    await Appointment.upsert(appointmentData, {
                        returning: true
                    });
                }
            }
        }
        
        // Process services
        if (services && services.length > 0) {
            for (const serviceData of services) {
                if (serviceData.id) {
                    await Service.upsert(serviceData, {
                        returning: true
                    });
                }
            }
        }
        
        res.json({
            message: 'Data synchronized successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Sync upload error:', error);
        res.status(500).json({ 
            message: 'Sync failed',
            error: error.message 
        });
    }
});

module.exports = router;
