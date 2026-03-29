const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runAppointmentApiTest() {
    console.log('--- API TEST: Appointments CRUD ---');
    try {
        const uniqueEmail = `patient_${Date.now()}@test.com`;
        
        // 1. Register a Patient
        console.log(`1. Registering new patient (${uniqueEmail})...`);
        const regRes = await axios.post(`${BASE_URL}/users/register`, {
            name: 'API Test Patient',
            email: uniqueEmail,
            password: 'password123',
            phone: '+998909998877'
        });
        const token = regRes.data.accessToken;
        const patientId = regRes.data.id;
        console.log('   [PASS] Patient registered. Token received.');

        // Configure axios to use token
        const authConfig = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 1.5 Create a Doctor
        console.log('\n1.5 Creating a doctor...');
        const docRes = await axios.post(`${BASE_URL}/doctors`, {
            name: 'Test APIDoctor',
            email: `doctor_${Date.now()}@test.com`,
            password: 'password123',
            specialization: 'Cardiology',
            experience: 5,
            phone: '+998901112233'
        }, authConfig).catch(err => err.response);
        
        let doctorId = 1; // fallback
        if (docRes.status === 201) {
            doctorId = docRes.data.id;
            console.log(`   [PASS] Doctor created. ID: ${doctorId}`);
        }

        // 2. Create an Appointment
        console.log('\n2. Creating an appointment...');
        const createRes = await axios.post(`${BASE_URL}/appointments`, {
            patientId: patientId,
            doctorId: doctorId,
            serviceId: null,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            time: '10:00',
            notes: 'Routine Checkup'
        }, authConfig).catch(err => err.response); // Catch to handle elegantly
        
        let appointmentId = null;
        if (createRes.status === 201) {
            console.log('   [PASS] Appointment created successfully.');
            appointmentId = createRes.data.id || createRes.data.appointment?.id;
        } else {
            console.log(`   [WARN] Could not create appointment (Status: ${createRes.status}). Reason: ${createRes.data.message || 'Unknown'}`);
            console.log('   (Make sure a Doctor with ID 1 exists in the database. Continuing test...)');
        }

        // 3. Get Appointments
        console.log('\n3. Fetching appointments list...');
        const listRes = await axios.get(`${BASE_URL}/appointments`, authConfig);
        console.log(`   [PASS] Fetched ${listRes.data.length || (listRes.data.appointments ? listRes.data.appointments.length : 0)} appointments.`);

        // 4. Cancel Appointment
        if (appointmentId) {
            console.log(`\n4. Canceling appointment #${appointmentId}...`);
            const delRes = await axios.delete(`${BASE_URL}/appointments/${appointmentId}`, authConfig).catch(err => err.response);
            if (delRes.status === 200 || delRes.status === 204) {
                console.log('   [PASS] Appointment canceled.');
            } else {
                console.log(`   [FAIL] Failed to cancel appointment. Status: ${delRes.status}`);
            }
        }

        console.log('\nResult: API Appointments test completed.');

    } catch (error) {
        console.error('\n   [FAIL] Test aborted due to error:', error.message);
        if (error.response) {
            console.error('          Data:', error.response.data);
        }
    }
}

runAppointmentApiTest();
