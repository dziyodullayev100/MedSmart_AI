/**
 * seed_demo.js — Module H: MedSmart Uzbek Demo Data Seeder
 * Run: node seed_demo.js
 *
 * Inserts realistic Uzbek clinical demo data:
 *  - 3 Admins, 5 Doctors, 10 Patients
 *  - 8 Services, 20 Appointments
 *  - 15 Diagnoses, 10 VitalSigns, 5 PatientHistories (AI input)
 *  - 10 Payments, RiskScores for 5 patients
 *
 * All passwords: Demo1234!
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, connectDB } = require('./config/db');
const { setupAssociations } = require('./config/associations');

const User          = require('./models/User');
const Doctor        = require('./models/Doctor');
const Patient       = require('./models/Patient');
const Service       = require('./models/Service');
const Appointment   = require('./models/Appointment');
const Diagnosis     = require('./models/Diagnosis');
const VitalSigns    = require('./models/VitalSigns');
const PatientHistory = require('./models/PatientHistory');
const Payment       = require('./models/Payment');
const RiskScore     = require('./models/RiskScore');
const Notification  = require('./models/Notification');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rnd    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const seed = async (exitProcess = true) => {
    try {
        await connectDB();
        setupAssociations();
        console.log('🔄  Syncing schema...');
        await sequelize.sync({ force: true });   // WIPE + recreate all 15 tables
        console.log('✅  Tables recreated.\n');

        // Pre-hash password once
        const hash = await bcrypt.hash('Demo1234!', 12);

        // ── 1. Admin Users ────────────────────────────────────────────────────
        console.log('👤  Creating 3 admins...');
        const adminData = [
            { name: 'Tizim Administratori',    email: 'admin@medsmart.uz',        phone: '+998901234567' },
            { name: 'Bosh Administrator',      email: 'admin2@medsmart.uz',       phone: '+998901234568' },
            { name: 'Klinika Direktori',       email: 'director@medsmart.uz',     phone: '+998901234569' }
        ];
        for (const a of adminData) {
            await User.create({ ...a, password: hash, role: 'admin', isActive: true });
            console.log(`   ✅ ${a.email} / Demo1234!`);
        }

        // ── 2. Doctors ────────────────────────────────────────────────────────
        console.log('\n🩺  Creating 5 doctors...');
        const doctorData = [
            {
                name: 'Dr. Alisher Karimov',
                email: 'dr.karimov@medsmart.uz',
                specialization: 'Cardiologist',
                experience: 15, consultationFee: 250000,
                licenseNumber: 'UZ-MED-001',
                education: 'Toshkent Tibbiyot Akademiyasi, 2008',
                workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
                workingHours: { start: '09:00', end: '17:00' }
            },
            {
                name: 'Dr. Malika Yusupova',
                email: 'dr.yusupova@medsmart.uz',
                specialization: 'General Practitioner',
                experience: 8, consultationFee: 150000,
                licenseNumber: 'UZ-MED-002',
                education: 'Samarqand Davlat Tibbiyot Instituti, 2015',
                workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                workingHours: { start: '08:00', end: '16:00' }
            },
            {
                name: 'Dr. Jasur Toshmatov',
                email: 'dr.toshmatov@medsmart.uz',
                specialization: 'Neurologist',
                experience: 12, consultationFee: 220000,
                licenseNumber: 'UZ-MED-003',
                education: 'Toshkent Tibbiyot Akademiyasi, 2011',
                workingDays: ['Monday','Wednesday','Friday'],
                workingHours: { start: '10:00', end: '18:00' }
            },
            {
                name: 'Dr. Nilufar Rashidova',
                email: 'dr.rashidova@medsmart.uz',
                specialization: 'Endocrinologist',
                experience: 10, consultationFee: 200000,
                licenseNumber: 'UZ-MED-004',
                education: 'Tashkent Pediatric Medical Institute, 2013',
                workingDays: ['Tuesday','Thursday','Saturday'],
                workingHours: { start: '09:00', end: '15:00' }
            },
            {
                name: 'Dr. Bobur Mirzayev',
                email: 'dr.mirzayev@medsmart.uz',
                specialization: 'Pulmonologist',
                experience: 7, consultationFee: 180000,
                licenseNumber: 'UZ-MED-005',
                education: 'Andijon Davlat Tibbiyot Instituti, 2016',
                workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
                workingHours: { start: '09:00', end: '17:00' }
            }
        ];
        const doctors = [];
        for (const d of doctorData) {
            const doc = await Doctor.create({
                ...d,
                password: hash,
                isActive: true,
                rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(2))
            });
            doctors.push(doc);
            console.log(`   ✅ ${d.email} — ${d.specialization}`);
        }

        // ── 3. Patients ───────────────────────────────────────────────────────
        console.log('\n👥  Creating 10 patients...');
        const patientData = [
            { name: 'Rustam Qodirov',      email: 'patient1@medsmart.uz',  phone: '+998901111001', dateOfBirth: '1978-03-15', gender: 'Male',   bloodType: 'A+',  city: 'Toshkent',   district: 'Yunusobod',  occupation: 'Muhandis' },
            { name: 'Madina Sobirova',     email: 'patient2@medsmart.uz',  phone: '+998901111002', dateOfBirth: '1990-07-22', gender: 'Female', bloodType: 'O-',  city: 'Samarqand',  district: 'Registon',   occupation: "O'qituvchi" },
            { name: 'Umid Voxidov',        email: 'patient3@medsmart.uz',  phone: '+998901111003', dateOfBirth: '1965-11-30', gender: 'Male',   bloodType: 'B+',  city: 'Buxoro',     district: 'Ark',        occupation: 'Tadbirkor' },
            { name: 'Aziza Bekmurodova',   email: 'patient4@medsmart.uz',  phone: '+998901111004', dateOfBirth: '1985-05-18', gender: 'Female', bloodType: 'AB+', city: 'Toshkent',   district: 'Mirzo Ulug\'bek', occupation: 'Shifokor' },
            { name: 'Dilshod Rahmatov',    email: 'patient5@medsmart.uz',  phone: '+998901111005', dateOfBirth: '1970-09-05', gender: 'Male',   bloodType: 'A-',  city: "Farg'ona",   district: 'Asaka',      occupation: 'Fermer' },
            { name: 'Feruza Xusanova',     email: 'patient6@medsmart.uz',  phone: '+998901111006', dateOfBirth: '1995-02-14', gender: 'Female', bloodType: 'O+',  city: 'Namangan',   district: 'Uychi',      occupation: 'Talaba' },
            { name: 'Akmal Zokirov',       email: 'patient7@medsmart.uz',  phone: '+998901111007', dateOfBirth: '1955-08-27', gender: 'Male',   bloodType: 'B-',  city: 'Andijon',    district: 'Marhamat',   occupation: 'Nafaqaxo\'r' },
            { name: 'Lola Ibragimova',     email: 'patient8@medsmart.uz',  phone: '+998901111008', dateOfBirth: '2000-12-10', gender: 'Female', bloodType: 'AB-', city: 'Toshkent',   district: 'Chilonzor',  occupation: 'Programmist' },
            { name: "Sanjar To'rayev",     email: 'patient9@medsmart.uz',  phone: '+998901111009', dateOfBirth: '1982-04-03', gender: 'Male',   bloodType: 'A+',  city: "Qo'qon",     district: 'Markaziy',   occupation: 'Haydovchi' },
            { name: 'Oygul Murodova',      email: 'patient10@medsmart.uz', phone: '+998901111010', dateOfBirth: '1973-06-20', gender: 'Female', bloodType: 'O+',  city: 'Toshkent',   district: 'Bektemir',   occupation: 'Buxgalter' }
        ];
        const patients = [];
        for (const p of patientData) {
            const pat = await Patient.create({
                ...p,
                password: hash,
                isActive: true,
                address: `${p.city} shahri, Mustaqillik ko'chasi ${rndInt(1, 100)}`,
                emergencyContactName:  `${p.name.split(' ')[0]} oilasi`,
                emergencyContactPhone: '+998901111999'
            });
            patients.push(pat);
            console.log(`   ✅ ${p.email} — ${p.name}`);
        }

        // ── 4. Services ───────────────────────────────────────────────────────
        console.log('\n🏥  Creating 8 services...');
        const serviceData = [
            { name: 'Konsultatsiya',           price: 150000, duration: 30, category: 'consultation', description: "Shifokor bilan umumiy ko'rik va maslahat" },
            { name: 'EKG (Elektrokardiogramma)', price: 80000, duration: 20, category: 'procedure',    description: 'Yurak elektr faoliyatini tekshirish' },
            { name: 'Umumiy qon tahlili',       price: 60000,  duration: 15, category: 'laboratory',   description: 'Qon formulasini aniqlash, OAK' },
            { name: 'Rentgen (X-Ray)',           price: 120000, duration: 25, category: 'imaging',      description: "Ko'krak qafasi rentgen tekshiruvi" },
            { name: 'UZI (Ultratovush)',         price: 200000, duration: 30, category: 'imaging',      description: "Qorin bo'shlig'i organlarini tekshirish" },
            { name: 'MRT (Magnit Rezonans)',     price: 800000, duration: 60, category: 'imaging',      description: 'Miyani batafsil tekshirish' },
            { name: 'Qandli diabet tahlili',     price: 90000,  duration: 15, category: 'laboratory',   description: 'Qondagi glyukoza darajasini aniqlash' },
            { name: 'Qon bosimi nazorati',       price: 50000,  duration: 10, category: 'procedure',    description: "Arterial qon bosimini o'lchash va monitoring" }
        ];
        const services = [];
        for (const s of serviceData) {
            const svc = await Service.create({ ...s, isActive: true });
            services.push(svc);
            console.log(`   ✅ ${s.name} — ${s.price.toLocaleString()} UZS`);
        }

        // ── 5. Appointments (20 total) ────────────────────────────────────────
        console.log('\n📅  Creating 20 appointments...');
        const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
        const complaints = [
            "Bosh og'riq va ko'ngil aynish",
            'Yurak urishida og\'riq',
            'Nafas olishda qiyinchilik',
            "Qon bosimi ko'tarilgan",
            'Qandli diabet nazorati',
            "Umumiy ko'rik",
            "Tana harorati ko'tarilgan",
            "Qorin og'riq",
            "Bo'g'im og'riq",
            'Charchoq va zaiflik'
        ];

        const appointments = [];
        // 10 past (completed/cancelled/no-show), 5 today/near, 5 future
        const apptConfigs = [
            // Past completed appointments
            { daysOffset: -28, status: 'completed' },
            { daysOffset: -25, status: 'completed' },
            { daysOffset: -20, status: 'completed' },
            { daysOffset: -18, status: 'completed' },
            { daysOffset: -15, status: 'completed' },
            { daysOffset: -12, status: 'completed' },
            { daysOffset: -10, status: 'cancelled' },
            { daysOffset: -8,  status: 'no-show' },
            { daysOffset: -5,  status: 'completed' },
            { daysOffset: -3,  status: 'completed' },
            // Active / confirmmed
            { daysOffset: 0,   status: 'confirmed' },
            { daysOffset: 0,   status: 'in-progress' },
            { daysOffset: 0,   status: 'scheduled' },
            { daysOffset: 1,   status: 'scheduled' },
            { daysOffset: 1,   status: 'confirmed' },
            // Future scheduled
            { daysOffset: 3,   status: 'scheduled' },
            { daysOffset: 5,   status: 'scheduled' },
            { daysOffset: 7,   status: 'scheduled' },
            { daysOffset: 10,  status: 'scheduled' },
            { daysOffset: 14,  status: 'scheduled' }
        ];

        for (let i = 0; i < apptConfigs.length; i++) {
            const cfg = apptConfigs[i];
            const appt = await Appointment.create({
                patientId:       patients[i % 10].id,
                doctorId:        doctors[i % 5].id,
                serviceId:       services[i % 8].id,
                appointmentDate: daysFromNow(cfg.daysOffset),
                appointmentTime: rnd(timeSlots),
                status:          cfg.status,
                chiefComplaint:  rnd(complaints),
                symptoms:        cfg.status === 'completed' ? "Tekshiruv o'tkazildi, barcha ko'rsatkichlar baholandi" : null,
                notes:           cfg.status === 'completed' ? "Bemor ko'rildi, retsept yozildi va keyingi tashrifga yo'l-yo'riq berildi." : null,
                followUpDate:    cfg.status === 'completed' ? daysFromNow(rndInt(14, 30)) : null,
                createdBy:       1
            });
            appointments.push(appt);
        }
        console.log('   ✅ 20 ta navbat yaratildi');

        // ── 6. Diagnoses (15, linked to completed appointments) ───────────────
        console.log('\n🔬  Creating 15 diagnoses...');
        const completedAppts = appointments.filter(a => a.status === 'completed');
        const diagnosisData = [
            { condition: 'Arterial gipertenziya',             icd10Code: 'I10',    severity: 'moderate', symptoms: "Bosh og'riq, ko'ngil aynish, ko'rish xiralanishi",         treatment: 'Lisinopril 10mg/kun, past tuzli parhez', status: 'chronic',     followUpRequired: true },
            { condition: 'Qandli diabet 2-tur',               icd10Code: 'E11',    severity: 'moderate', symptoms: 'Chanqash, tez-tez siydik qilish, charchoq',               treatment: 'Metformin 850mg x 2/kun, parhez',        status: 'chronic',     followUpRequired: true },
            { condition: "O'tkir bronxit",                    icd10Code: 'J20.9',  severity: 'mild',     symptoms: "Yo'tal, harorat 37.5°C, bo'g'iz og'riq",                 treatment: 'Amoksitsillin 500mg x 3/kun, 7 kun',     status: 'resolved',    followUpRequired: false },
            { condition: 'Migren',                            icd10Code: 'G43.9',  severity: 'moderate', symptoms: "Kuchli bosh og'riq, yorug'likka sezgirlik",               treatment: 'Sumatriptan 50mg, dam olish',            status: 'active',      followUpRequired: false },
            { condition: 'Gripp (Influenza)',                  icd10Code: 'J11',    severity: 'mild',     symptoms: "Harorat 38.5°C, mushaklarning og'rishi",                  treatment: 'Oseltamivir 75mg x 2/kun, 5 kun',        status: 'resolved',    followUpRequired: false },
            { condition: 'Gastrit',                           icd10Code: 'K29.7',  severity: 'mild',     symptoms: "Qorin og'rig'i, erishning og'rishi",                      treatment: 'Omeprazol 20mg/kun, parhez',             status: 'monitoring',  followUpRequired: true },
            { condition: 'Surunkali yurak yetishmovchiligi',  icd10Code: 'I50.9',  severity: 'severe',   symptoms: 'Nafas qisishi, shish, charchoq',                          treatment: 'Furosemid 40mg, Enalapril 5mg',          status: 'chronic',     followUpRequired: true },
            { condition: 'Pnevmoniya',                        icd10Code: 'J18.9',  severity: 'severe',   symptoms: "Harorat 39°C, yo'tal, ko'krak og'rig'i",                  treatment: 'Amoksiklav 925mg x 2/kun, 10 kun',       status: 'resolved',    followUpRequired: false },
            { condition: 'Depressiya',                        icd10Code: 'F32.9',  severity: 'moderate', symptoms: 'Kayfiyat tushishi, uyqu buzilishi, charchoq',             treatment: 'Setralin 50mg/kun, psixoterapiya',       status: 'active',      followUpRequired: true },
            { condition: 'Semizlik 1-daraja',                 icd10Code: 'E66.0',  severity: 'mild',     symptoms: 'BMI > 30, nafas qisishi',                                treatment: 'Kaloriya cheklangan parhez',              status: 'monitoring',  followUpRequired: true },
            { condition: 'Bronxial astma',                    icd10Code: 'J45.9',  severity: 'moderate', symptoms: "Nafas qisishi, xirillash, yo'tal hujumlari",              treatment: 'Salbutamol inhaler talabga ko\'ra',       status: 'chronic',     followUpRequired: true },
            { condition: 'Osteoartrit (tizza)',               icd10Code: 'M17.9',  severity: 'moderate', symptoms: "Tizza bo'g'imida og'riq, harakatni cheklash",             treatment: 'Diklofenak gel, fizioterapiya',           status: 'active',      followUpRequired: false },
            { condition: "Qalqonsimon bez gipotireozi",       icd10Code: 'E03.9',  severity: 'mild',     symptoms: "Charchoq, vazn ortishi, sovuqqa sezgirlik",               treatment: 'Levotiroksim 100mcg/kun',                status: 'monitoring',  followUpRequired: true },
            { condition: 'Anemiya (temir tanqisligi)',         icd10Code: 'D50.9',  severity: 'mild',     symptoms: "Zaiflik, bosh aylanishi, teri rangparlik",                treatment: "Temir sulfat 100mg x 2/kun, C vitamini", status: 'active',      followUpRequired: false },
            { condition: "Yurak koronar kasalligi",            icd10Code: 'I25.9',  severity: 'severe',   symptoms: "Ko'krak og'rig'i, nafas qisishi, charchoq",               treatment: 'Atorvastatin 40mg, Aspirin 100mg',       status: 'chronic',     followUpRequired: true }
        ];
        for (let i = 0; i < diagnosisData.length; i++) {
            const appt = completedAppts[i % completedAppts.length];
            await Diagnosis.create({
                patientId:     appt.patientId,
                doctorId:      appt.doctorId,
                appointmentId: appt.id,
                ...diagnosisData[i],
                dateDiagnosed: appt.appointmentDate,
                prescription:  `Retsept ${i + 1}: ${diagnosisData[i].treatment}`,
                notes:         `Bemorning ahvoli ${diagnosisData[i].severity === 'severe' ? 'og\'ir' : 'qoniqarli'}`
            });
        }
        console.log('   ✅ 15 ta tashxis yaratildi');

        // ── 7. VitalSigns (10 records) ────────────────────────────────────────
        console.log('\n💓  Creating 10 vital signs records...');
        for (let i = 0; i < 10; i++) {
            const pat = patients[i];
            const w   = rndInt(55, 120);
            const h   = rndInt(155, 192);
            const bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(2));
            await VitalSigns.create({
                patientId:              pat.id,
                doctorId:               doctors[i % 5].id,
                appointmentId:          appointments[i].id,
                bloodPressureSystolic:  rndInt(100, 165),
                bloodPressureDiastolic: rndInt(60, 100),
                heartRate:              rndInt(58, 105),
                temperature:            parseFloat((36.0 + Math.random() * 2.5).toFixed(1)),
                oxygenSaturation:       parseFloat((93 + Math.random() * 7).toFixed(1)),
                weight:                 w,
                height:                 h,
                bmi,
                glucoseLevel:           parseFloat((4.5 + Math.random() * 7).toFixed(1)),
                cholesterolLevel:       parseFloat((3.5 + Math.random() * 4).toFixed(1)),
                recordedAt:             new Date(Date.now() - rndInt(0, 30) * 86400000)
            });
        }
        console.log('   ✅ 10 ta hayotiy belgilar yaratildi');

        // ── 8. PatientHistory (5 records — ⭐ AI PRIMARY INPUT) ────────────────
        console.log('\n📋  Creating 5 patient history records (⭐ AI input)...');
        const historyData = [
            {
                patientId:          patients[0].id,  // Rustam Qodirov (1978)
                diseaseName:        'Arterial gipertenziya',
                symptoms:           "Bosh og'riq, ko'ngil aynish, ko'rish xiralanishi, bosh aylanishi",
                treatment:          'Lisinopril 10mg, Aspirin 100mg, past tuzli parhez',
                startDate:          '2018-05-10',
                isOngoing:          true,
                severity:           'moderate',
                outcome:            'chronic',
                chronicConditions:  'Arterial gipertenziya, Ateroskleroz',
                currentMedications: 'Lisinopril 10mg, Aspirin 100mg, Atorvastatin 20mg',
                pastMedications:    'Enalapril 5mg (2017-2018)',
                allergies:          'Penisilin, Sulfanilamidlar',
                familyHistory:      'Otasi: Yurak infarkti (58 yoshida); Onasi: Gipertenziya; Buva: Insult',
                smokingStatus:      'former',
                alcoholUse:         'occasional',
                exerciseFrequency:  'rarely',
                dietType:           'cardiac',
                notes:              "Gipertonik kriz epizodlari kuzatilmoqda. Kuchli stress bilan og'irlashadi."
            },
            {
                patientId:          patients[2].id,  // Umid Voxidov (1965)
                diseaseName:        'Qandli diabet 2-tur',
                symptoms:           'Chanqash, tez-tez siydik qilish, oyoq-qo\'l achishishi, ko\'rish pasayishi, charchoq',
                treatment:          'Metformin 1000mg, Glibenklamid 5mg, parhez',
                startDate:          '2015-02-20',
                isOngoing:          true,
                severity:           'moderate',
                outcome:            'chronic',
                chronicConditions:  'Qandli diabet 2-tur, Semizlik, Gipertenziya',
                currentMedications: 'Metformin 1000mg x 2/kun, Glibenklamid 5mg, Lisinopril 5mg',
                pastMedications:    'Glipizid 5mg (2014-2015)',
                allergies:          'Sulfanilamidlar, Ibuprofen',
                familyHistory:      'Otasi: Qandli diabet 2-tur; Buvisi: Gipertenziya; Amakisi: Insult',
                pastSurgeries:      "Katarakta operatsiyasi o'ng ko'z 2021",
                smokingStatus:      'never',
                alcoholUse:         'none',
                exerciseFrequency:  'none',
                dietType:           'diabetic',
                notes:              "HbA1c 8.2% - nazorat qoniqarsiz. Parhez va jismoniy faollikni oshirish kerak."
            },
            {
                patientId:          patients[4].id,  // Dilshod Rahmatov (1970)
                diseaseName:        "Surunkali obstruktiv o'pka kasalligi (COLD)",
                symptoms:           "Yo'tal, balg'am, nafas qisishi, ko'krak siqilishi, havo yetishmasligi hissi",
                treatment:          'Salbutamol inhaler, Tiotropiy 18mcg, Flutikazon/Salmeterol',
                startDate:          '2012-09-01',
                isOngoing:          true,
                severity:           'severe',
                outcome:            'chronic',
                chronicConditions:  "COLD, Bronxial astma, Surunkali bronxit",
                currentMedications: 'Salbutamol inhaler talabga ko\'ra, Tiotropiy 18mcg/kun, Prednizolon 5mg',
                pastMedications:    'Teofillin 200mg (2010-2012)',
                allergies:          'Aspirin, Ibuprofen (bronxospazm chaqiradi)',
                familyHistory:      "Akasi: Bronxial astma; Otasi: COLD; Onasi: Allergik rinit",
                pastSurgeries:      'Appendektomiya 2005',
                smokingStatus:      'current',
                alcoholUse:         'moderate',
                exerciseFrequency:  'none',
                dietType:           'normal',
                notes:              "Chekishni to'xtata olmayapti. FEV1 52% - og'ir COLD bosqichi."
            },
            {
                patientId:          patients[6].id,  // Akmal Zokirov (1955)
                diseaseName:        'Yurak koronar kasalligi',
                symptoms:           "Ko'krak og'rig'i (stenokardiya), nafas qisishi, charchoq, oyoq shishi",
                treatment:          'Atorvastatin 40mg, Metoprolol 50mg, Aspirin 100mg, Enalapril 10mg',
                startDate:          '2014-03-15',
                isOngoing:          true,
                severity:           'severe',
                outcome:            'chronic',
                chronicConditions:  'Yurak koronar kasalligi, Arterial gipertenziya, Qandli diabet 2-tur, Giperlipidemiya',
                currentMedications: 'Atorvastatin 40mg, Metoprolol 50mg, Aspirin 100mg, Enalapril 10mg, Furosemid 20mg',
                pastMedications:    'Simvastatin 20mg (2012-2014), Perindopril (2013-2014)',
                allergies:          "Ko'rsatilmagan",
                familyHistory:      "Otasi: Yurak infarkti (62 yoshida); Onasi: Insult; Buvisi: Qandli diabet",
                pastSurgeries:      'Aorto-koronar shuntirovka (AKSH) 2019, Tizza endoprotezlash 2016',
                smokingStatus:      'former',
                alcoholUse:         'none',
                exerciseFrequency:  'rarely',
                dietType:           'cardiac',
                notes:              "Infarktsdan keyingi holat. Holter monitoring 3 oyda bir. EF 45%."
            },
            {
                patientId:          patients[9].id,  // Oygul Murodova (1973)
                diseaseName:        'Qalqonsimon bez gipotireozi',
                symptoms:           "Charchoq, tana vazni ortishi, sovuqqa sezgirlik, teri quruqligi, soch to'kilishi, depressiya belgilari",
                treatment:          'Levotiroksim 100mcg/kun ertalab ochda',
                startDate:          '2020-11-05',
                isOngoing:          true,
                severity:           'mild',
                outcome:            'chronic',
                chronicConditions:  "Gipotireoz, Temir tanqisligi anemiyasi",
                currentMedications: "Levotiroksim 100mcg/kun, Temir preparati (Ferrum Lek 100mg)",
                pastMedications:    'Levotiroksim 75mcg (2020-2021)',
                allergies:          "Yo'q",
                familyHistory:      "Onasi: Gipotireoz; Xolasi: Tireotoksikoz",
                smokingStatus:      'never',
                alcoholUse:         'none',
                exerciseFrequency:  'weekly',
                dietType:           'normal',
                notes:              "TSH darajasi normallashdi. Yiliga 2 marta qalqonsimon bez USI."
            }
        ];
        for (const h of historyData) {
            await PatientHistory.create({ ...h, recordedAt: new Date(), recordedBy: doctors[0].id });
        }
        console.log('   ✅ 5 ta tibbiy tarix (⭐ AI uchun) yaratildi');

        // ── 9. Payments (10 records) ──────────────────────────────────────────
        console.log('\n💳  Creating 10 payments...');
        const payConfigs = [
            { status: 'paid',    method: 'cash',      discount: 0 },
            { status: 'paid',    method: 'card',      discount: 10 },
            { status: 'paid',    method: 'transfer',  discount: 0 },
            { status: 'pending', method: null,        discount: 0 },
            { status: 'pending', method: null,        discount: 5 },
            { status: 'overdue', method: null,        discount: 0 },
            { status: 'paid',    method: 'insurance', discount: 20 },
            { status: 'refunded',method: 'card',      discount: 0 },
            { status: 'paid',    method: 'cash',      discount: 0 },
            { status: 'cancelled',method: null,       discount: 0 }
        ];
        for (let i = 0; i < 10; i++) {
            const appt = appointments[i];
            const svc  = services[(appt.serviceId - 1) % services.length] || services[0];
            const cfg  = payConfigs[i];
            await Payment.create({
                patientId:     appt.patientId,
                appointmentId: appt.id,
                serviceId:     appt.serviceId,
                amount:        parseFloat(svc.price),
                currency:      'UZS',
                discount:      cfg.discount,
                status:        cfg.status,
                paymentMethod: cfg.method,
                paidAt:        cfg.status === 'paid' ? new Date() : null,
                dueDate:       daysFromNow(i < 5 ? -5 : 7),
                transactionId: cfg.status === 'paid' ? `TXN-${Date.now()}-${i}` : null,
                notes:         cfg.discount > 0 ? `${cfg.discount}% chegirma qo'llanildi` : null
            });
        }
        console.log("   ✅ 10 ta to'lov yaratildi");

        // ── 10. RiskScores (5 patients with history) ──────────────────────────
        console.log('\n📊  Creating 5 risk scores...');
        const riskData = [
            { patientId: patients[0].id, overallRisk: 72, cardiovascularRisk: 80, diabetesRisk: 35, respiratoryRisk: 20, neurologicalRisk: 30, trend: 'stable' },
            { patientId: patients[2].id, overallRisk: 68, cardiovascularRisk: 55, diabetesRisk: 85, respiratoryRisk: 20, neurologicalRisk: 25, trend: 'worsening' },
            { patientId: patients[4].id, overallRisk: 75, cardiovascularRisk: 45, diabetesRisk: 20, respiratoryRisk: 90, neurologicalRisk: 20, trend: 'stable' },
            { patientId: patients[6].id, overallRisk: 88, cardiovascularRisk: 92, diabetesRisk: 75, respiratoryRisk: 50, neurologicalRisk: 40, trend: 'worsening' },
            { patientId: patients[9].id, overallRisk: 35, cardiovascularRisk: 20, diabetesRisk: 15, respiratoryRisk: 10, neurologicalRisk: 15, trend: 'improving' }
        ];
        for (const r of riskData) {
            await RiskScore.create({
                ...r,
                lastCalculated:  new Date(),
                calculationBasis: {
                    vitalsCount:   3,
                    historyCount:  1,
                    diagnoses:     ['chronic'],
                    lifestyle:     r.patientId === patients[4].id ? ['current_smoker', 'no_exercise'] : ['former_smoker']
                }
            });
        }
        console.log('   ✅ 5 ta risk score yaratildi');

        // ── 11. Sample Notifications ──────────────────────────────────────────
        console.log('\n🔔  Creating sample notifications...');
        await Notification.bulkCreate([
            { userId: doctors[0].id, userRole: 'doctor', type: 'appointment', title: "Yangi navbat", message: `${patients[0].name} bugun soat 10:00 da navbatda`, priority: 'medium', isRead: false },
            { userId: 1, userRole: 'admin', type: 'system', title: "Tizim yangilanishi", message: "MedSmart v2.1 muvaffaqiyatli o'rnatildi", priority: 'low', isRead: false },
            { userId: doctors[3].id, userRole: 'doctor', type: 'ai_alert', title: "Yuqori risk darajasi", message: `${patients[6].name} uchun AI yuqori risk aniqladi (88/100)`, priority: 'high', isRead: false },
            { userId: patients[0].id, userRole: 'patient', type: 'payment', title: "To'lov eslatmasi", message: "Konsultatsiya uchun to'lov muddati tugaydi", priority: 'medium', isRead: false }
        ]);
        console.log('   ✅ 4 ta bildirishnoma yaratildi');

        // ─────────────────────────────────────────────────────────────────────
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║           ✅  SEED MUVAFFAQIYATLI YAKUNLANDI             ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  3 Admin  │  5 Doctors  │  10 Patients                   ║');
        console.log('║  8 Services  │  20 Appointments                           ║');
        console.log('║  15 Diagnoses  │  10 VitalSigns  │  5 Payments            ║');
        console.log('║  5 PatientHistories (⭐ AI)  │  5 RiskScores              ║');
        console.log('║  4 Notifications  │  10 Payments                          ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  Parol: Demo1234!  (barcha foydalanuvchilar uchun)        ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  Admin:   admin@medsmart.uz                               ║');
        console.log('║  Doctor:  dr.karimov@medsmart.uz                          ║');
        console.log('║  Patient: patient1@medsmart.uz                            ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        if (exitProcess) process.exit(0);

    } catch (err) {
        console.error('\n❌ SEED XATOSI:', err.message);
        if (err.errors) err.errors.forEach(e => console.error('  -', e.message));
        console.error(err.stack);
        if (exitProcess) process.exit(1);
    }
};

if (require.main === module) {
    seed();
}

module.exports = seed;
