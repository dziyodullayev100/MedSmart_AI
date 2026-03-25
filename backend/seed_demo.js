const { sequelize, connectDB } = require('./config/db');
const bcrypt = require('bcryptjs');
const { setupAssociations } = require('./config/associations');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Service = require('./models/Service');
const Appointment = require('./models/Appointment');
const Diagnosis = require('./models/Diagnosis');
const VitalSigns = require('./models/VitalSigns');
const PatientHistory = require('./models/PatientHistory');
const Payment = require('./models/Payment');

const seedDemo = async () => {
    try {
        console.log('🔄 Connecting to Database...');
        await sequelize.authenticate();
        setupAssociations();
        await sequelize.sync();

        // Check if demo data exists to skip
        const adminUser = await User.findOne({ where: { email: 'admin@medsmart.uz' } });
        if (adminUser) {
            console.log('✅ Demo data already exists. Skipping seed.');
            process.exit(0);
            return;
        }

        console.log('🌱 Seeding MedSmart Demo Data...');
        const passwordHash = await bcrypt.hash('Demo1234!', 10);

        // 1. Admin
        console.log('⏳ Creating Admin...');
        await User.create({ name: 'Admin User', email: 'admin@medsmart.uz', password: passwordHash, role: 'admin' });

        // 2. Doctors
        console.log('⏳ Creating Doctors...');
        const docs = [
            { name: 'Dr. Alisher Karimov', email: 'alisher@medsmart.uz', specialization: 'Kardiolog', experience: 15 },
            { name: 'Dr. Malika Yusupova', email: 'malika@medsmart.uz', specialization: 'Umumiy amaliyot', experience: 8 },
            { name: 'Dr. Jasur Toshmatov', email: 'jasur@medsmart.uz', specialization: 'Nevrolog', experience: 12 },
            { name: 'Dr. Nilufar Rashidova', email: 'nilufar@medsmart.uz', specialization: 'Endokrinolog', experience: 10 },
            { name: 'Dr. Bobur Mirzayev', email: 'bobur@medsmart.uz', specialization: 'Pulmonolog', experience: 7 },
            { name: 'Dr. Shaxlo Ergasheva', email: 'shaxlo@medsmart.uz', specialization: 'Pediatr', experience: 9 },
            { name: 'Dr. Timur Xolmatov', email: 'timur@medsmart.uz', specialization: 'Ortoped', experience: 11 },
            { name: 'Dr. Zulfiya Nazarova', email: 'zulfiya@medsmart.uz', specialization: 'Dermatolog', experience: 6 }
        ];
        const doctors = [];
        for (const doc of docs) {
            doctors.push(await Doctor.create({ ...doc, password: passwordHash }));
        }

        // 3. Patients
        console.log('⏳ Creating Patients...');
        const patNames = [
            'Rustam Qodirov', 'Madina Sobirova', 'Umid Voxidov', 'Aziza Bekmurodova', 'Dilshod Rahmatov', 
            'Feruza Xusanova', 'Akmal Zokirov', 'Lola Ibragimova', 'Sanjar To\'rayev', 'Oygul Murodova',
            'Farruh G\'aniyev', 'Muborak Salayeva', 'Doston Oripov', 'Nodira Qosimova', 'Ilhom Jalilov'
        ];
        const patients = [];
        for (let i = 0; i < 15; i++) {
             patients.push(await Patient.create({
                 name: patNames[i],
                 email: `patient${i+1}@demo.uz`,
                 password: passwordHash,
                 phone: '+99890' + Math.floor(1000000 + Math.random() * 9000000),
                 address: 'Toshkent shahar'
             }));
        }

        // 4. Services
        console.log('⏳ Creating Services...');
        const srvDefs = [
            { name: 'Konsultatsiya', price: 50000, description: 'Umumiy ko\'rik' },
            { name: 'EKG', price: 80000, description: 'Yurak ritmini tekshirish' },
            { name: 'Qon tahlili', price: 60000, description: 'Umumiy qon tahlili' },
            { name: 'Rentgen', price: 120000, description: 'X-Ray' },
            { name: 'UZI', price: 150000, description: 'Ultratovush tekshiruvi' },
            { name: 'MRT', price: 800000, description: 'Magnit rezonans tomografiya' },
            { name: 'Siydik tahlili', price: 40000, description: 'Umumiy siydik tahlili' },
            { name: 'Qandli diabet tahlili', price: 90000, description: 'Qand miqdori' },
            { name: 'Allergiya testi', price: 200000, description: 'Allergenlarni aniqlash' },
            { name: 'Qon bosimi', price: 30000, description: 'Bosimni o\'lchash' },
            { name: 'O\'pka faoliyati', price: 110000, description: 'Spirometriya' },
            { name: 'Nevrologik ko\'rik', price: 130000, description: 'Nevrolog ko\'rigi' }
        ];
        const services = [];
        for (const s of srvDefs) {
            services.push(await Service.create(s));
        }

        // 5. Appointments, Diagnoses, Payments
        console.log('⏳ Creating Appts, Diagnoses, VitalSigns, Payments...');
        const conditions = ['Hypertension', 'Diabetes Type 2', 'Influenza', 'Bronchitis', 'Migraine', 'Gastritis', 'Anemia'];
        const statuses = ['scheduled', 'completed', 'cancelled'];
        const paymentStatuses = ['paid', 'pending', 'overdue'];

        for (let i = 0; i < 20; i++) {
            const doc = doctors[Math.floor(Math.random() * doctors.length)];
            const pat = patients[Math.floor(Math.random() * patients.length)];
            const srv = services[Math.floor(Math.random() * services.length)];
            const status = statuses[i % 3]; // Make sure we get a mix
            
            // Random date between last 30d and next 14d
            let date = new Date();
            date.setDate(date.getDate() + (Math.floor(Math.random() * 44) - 30));

            const appt = await Appointment.create({
                patientId: pat.id, doctorId: doc.id, serviceId: srv.id,
                date: date.toISOString().split('T')[0], time: '10:00',
                status: status, notes: 'Demo system generated appointment'
            });

            if (status === 'completed' || i < 15) {
                await Payment.create({
                    appointmentId: appt.id, patientId: pat.id, amount: srv.price,
                    status: paymentStatuses[i % 3], paymentDate: status === 'completed' ? new Date() : null,
                    paymentMethod: 'card'
                });
            }

            if (status === 'completed') {
                await Diagnosis.create({
                    patientId: pat.id, doctorId: doc.id, appointmentId: appt.id,
                    condition: conditions[i % conditions.length],
                    severity: 'moderate',
                    symptoms: ['Symptom 1', 'Symptom 2'],
                    notes: 'Identified during demo checkup'
                });
            }
        }

        // Additional Diagnoses to hit 25
        for (let i = 0; i < 15; i++) {
            await Diagnosis.create({
                patientId: patients[i].id, doctorId: doctors[0].id,
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                severity: 'mild',
                dateDiagnosed: new Date()
            });
        }

        // 6. Vital Signs (30 records)
        for (let i = 0; i < 30; i++) {
            await VitalSigns.create({
                patientId: patients[i % 15].id,
                bloodPressure: `${110 + Math.floor(Math.random()*50)}/${70 + Math.floor(Math.random()*30)}`,
                heartRate: 60 + Math.floor(Math.random()*40),
                temperature: 36.2 + Math.random()*2.3,
                oxygenSaturation: 94 + Math.floor(Math.random()*6)
            });
        }

        // 7. Patient History (10 records for patients 45+ logically)
        for (let i = 0; i < 10; i++) {
            await PatientHistory.create({
                patientId: patients[i % 15].id,
                condition: 'Surunkali yurak yetishmovchiligi (Demo)',
                diagnosisDate: new Date('2020-01-01'),
                treatment: 'Medications',
                notes: 'Continuous monitoring required'
            });
        }

        console.log('✅ SEED COMPLETE! Demo user passwords: "Demo1234!"');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEED ERROR:', err);
        process.exit(1);
    }
};

// Export for programmatic use via /api/demo/seed
module.exports = seedDemo;

if (require.main === module) {
    seedDemo();
}
