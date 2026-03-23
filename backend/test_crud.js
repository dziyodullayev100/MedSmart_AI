const http = require('http');

async function testApi() {
    console.log('--- Starting CRUD Tests ---');

    // Helper fetch function using standard Node fetch if available
    const fetchAPI = async (url, options = {}) => {
        try {
            const res = await fetch(`http://localhost:5000/api${url}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            const data = await res.json();
            return { status: res.status, data };
        } catch (e) {
            console.error(`Error requesting ${url}:`, e);
            return { status: 500, data: null };
        }
    };

    try {
        // --- 1. DOCTOR TESTS ---
        console.log('\n[1] Testing DOCTOR CRUD');
        let doctorId;

        // POST
        let res = await fetchAPI('/doctors', {
            method: 'POST',
            body: JSON.stringify({
                name: "Test Doctor",
                email: "test_doc_" + Date.now() + "@example.com",
                password: "password123",
                specialization: "Testing",
                experience: 5,
                phone: "123456789",
                schedule: { monday: "10:00-14:00" }
            })
        });
        console.log('Create Doctor Status:', res.status);
        if (res.status === 201) {
            doctorId = res.data.id;
            console.log('Created Doctor ID:', doctorId);
        } else return console.log('Failed to create doctor:', res.data);

        // PUT
        res = await fetchAPI(`/doctors/${doctorId}`, {
            method: 'PUT',
            body: JSON.stringify({ experience: 10, name: "Updated Test Doctor" })
        });
        console.log('Update Doctor Status:', res.status);
        console.log('Updated Doctor Name/Exp:', res.data.name, res.data.experience);


        // --- 2. PATIENT TESTS ---
        console.log('\n[2] Testing PATIENT CRUD');
        let patientId;

        // POST
        res = await fetchAPI('/patients', {
            method: 'POST',
            body: JSON.stringify({
                name: "Test Patient",
                email: "test_pat_" + Date.now() + "@example.com",
                password: "password123",
                phone: "987654321",
                dateOfBirth: "1990-01-01"
            })
        });
        console.log('Create Patient Status:', res.status);
        if (res.status === 201) {
            patientId = res.data.id;
            console.log('Created Patient ID:', patientId);
        } else return console.log('Failed to create patient:', res.data);

        // PUT
        res = await fetchAPI(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify({ phone: "000000000" })
        });
        console.log('Update Patient Status:', res.status);
        console.log('Updated Patient Phone:', res.data.phone);


        // --- 3. APPOINTMENT TESTS ---
        console.log('\n[3] Testing APPOINTMENT CRUD');
        let appointmentId;

        // POST
        res = await fetchAPI('/appointments', {
            method: 'POST',
            body: JSON.stringify({
                patientId: patientId,
                doctorId: doctorId,
                date: "2026-04-01",
                time: "10:30",
                notes: "Initial test notes"
            })
        });
        console.log('Create Appointment Status:', res.status);
        if (res.status === 201) {
            appointmentId = res.data.id;
            console.log('Created Appointment ID:', appointmentId);
        } else return console.log('Failed to create appointment:', res.data);

        // PUT
        res = await fetchAPI(`/appointments/${appointmentId}`, {
            method: 'PUT',
            body: JSON.stringify({ notes: "Updated test notes" })
        });
        console.log('Update Appointment Status:', res.status);
        console.log('Updated Appointment Notes:', res.data.notes);


        // --- 4. CLEANUP (DELETE TESTS) ---
        console.log('\n[4] Testing DELETE operations');

        // DELETE Appointment
        res = await fetchAPI(`/appointments/${appointmentId}`, { method: 'DELETE' });
        console.log('Delete Appointment Status:', res.status);

        // DELETE Patient
        res = await fetchAPI(`/patients/${patientId}`, { method: 'DELETE' });
        console.log('Delete Patient Status:', res.status);

        // DELETE Doctor
        res = await fetchAPI(`/doctors/${doctorId}`, { method: 'DELETE' });
        console.log('Delete Doctor Status:', res.status);

        console.log('\n--- Tests Completed ---');
    } catch (err) {
        console.error("Test execution failed:", err);
    }
}

testApi();
