const { sequelize } = require('./config/db');
const User = require('./models/User');
const Patient = require('./models/Patient');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync();
        
        let usersCreated = 0;
        let patientsCreated = 0;

        // Create Admin User
        const existingAdmin = await User.findOne({ where: { email: 'admin@medsmart.uz' } });
        if (!existingAdmin) {
            const adminPassword = await bcrypt.hash('Admin123', 10);
            await User.create({
                name: 'Tizim Administratori',
                email: 'admin@medsmart.uz',
                password: adminPassword
            });
            console.log('✅ Admin yaratildi: admin@medsmart.uz / Admin123');
            usersCreated++;
        }

        // Create Patient
        const existingPatient = await Patient.findOne({ where: { email: 'bemor@medsmart.uz' } });
        if (!existingPatient) {
            const patientPassword = await bcrypt.hash('Bemor123', 10);
            await Patient.create({
                name: 'Aziz Bemor',
                email: 'bemor@medsmart.uz',
                password: patientPassword
            });
            console.log('✅ Bemor yaratildi: bemor@medsmart.uz / Bemor123');
            patientsCreated++;
        }

        console.log(`Malumotlar bazasi tayyor. ${usersCreated} admin, ${patientsCreated} bemor qo'shildi.`);
        process.exit(0);

    } catch(err) {
        console.error('Xatolik yuz berdi:', err);
        process.exit(1);
    }
}

seed();
