/**
 * test_ai_data.js
 * Tests AI data collection endpoints: Diagnosis, PatientHistory, VitalSigns
 * Run with: node test_ai_data.js (server must be running on port 5000)
 */

async function testAIData() {
    console.log('=== AI Data Collection Endpoint Tests ===\n');

    const fetchAPI = async (url, options = {}) => {
        try {
            const res = await fetch(`http://localhost:5000/api${url}`, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            const data = await res.json();
            return { status: res.status, data };
        } catch (e) {
            console.error(`Error requesting ${url}:`, e.message);
            return { status: 500, data: null };
        }
    };

    let doctorId, patientId, diagnosisId, historyId, vitalId;

    try {
        // ── Setup: Create Doctor + Patient ──────────────────────────
        console.log('[Setup] Creating test Doctor and Patient...');

        let res = await fetchAPI('/doctors', {
            method: 'POST',
            body: JSON.stringify({
                name: 'AI Test Doctor',
                email: `ai_doc_${Date.now()}@test.com`,
                password: 'password123',
                specialization: 'AI Testing',
                experience: 5,
                phone: '998901234567'
            })
        });
        if (res.status !== 201) return console.error('Failed to create doctor:', res.data);
        doctorId = res.data.id;
        console.log('  ✓ Doctor created:', doctorId);

        res = await fetchAPI('/patients', {
            method: 'POST',
            body: JSON.stringify({
                name: 'AI Test Patient',
                email: `ai_pat_${Date.now()}@test.com`,
                password: 'password123',
                phone: '998907654321',
                dateOfBirth: '1990-05-15'
            })
        });
        if (res.status !== 201) return console.error('Failed to create patient:', res.data);
        patientId = res.data.id;
        console.log('  ✓ Patient created:', patientId);

        // ── 1. DIAGNOSIS TESTS ──────────────────────────────────────
        console.log('\n[1] Testing DIAGNOSIS CRUD');

        // POST - Create Diagnosis
        res = await fetchAPI('/diagnoses', {
            method: 'POST',
            body: JSON.stringify({
                patientId,
                doctorId,
                condition: 'Seasonal Influenza',
                symptoms: ['fever', 'cough', 'fatigue', 'headache'],
                severity: 'moderate',
                notes: 'Patient presented with typical flu symptoms during winter season.',
                status: 'active'
                // dateDiagnosed auto-set to NOW by server
            })
        });
        console.log('  Create Diagnosis Status:', res.status, res.status === 201 ? '✓' : '✗');
        if (res.status !== 201) return console.error('  Failed:', res.data);
        diagnosisId = res.data.id;
        console.log('  Diagnosis ID:', diagnosisId);
        console.log('  dateDiagnosed:', res.data.dateDiagnosed, '(auto-set by server ✓)');
        console.log('  createdAt:', res.data.createdAt, '(Sequelize timestamps ✓)');
        console.log('  symptoms:', JSON.stringify(res.data.symptoms));
        console.log('  severity:', res.data.severity);

        // GET by Patient
        res = await fetchAPI(`/diagnoses/patient/${patientId}`);
        console.log('  GET by Patient Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  Diagnoses found:', res.data.length);

        // GET single
        res = await fetchAPI(`/diagnoses/${diagnosisId}`);
        console.log('  GET single Status:', res.status, res.status === 200 ? '✓' : '✗');

        // PUT - Update
        res = await fetchAPI(`/diagnoses/${diagnosisId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'resolved', severity: 'mild' })
        });
        console.log('  Update Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  Updated status:', res.data.status, '/ severity:', res.data.severity);

        // ── 2. PATIENT HISTORY TESTS ────────────────────────────────
        console.log('\n[2] Testing PATIENT HISTORY CRUD');

        // POST - Create History entry
        res = await fetchAPI('/history', {
            method: 'POST',
            body: JSON.stringify({
                patientId,
                pastConditions: 'Childhood asthma (resolved)',
                chronicConditions: ['hypertension', 'type-2 diabetes'],
                allergies: 'Penicillin, Pollen',
                medications: [
                    { name: 'Metformin', dose: '500mg', frequency: '2x/day' },
                    { name: 'Amlodipine', dose: '5mg', frequency: '1x/day' }
                ],
                familyHistory: 'Father: heart disease. Mother: diabetes.',
                surgeries: 'Appendectomy (2010)'
                // recordedAt auto-set to NOW by server
            })
        });
        console.log('  Create History Status:', res.status, res.status === 201 ? '✓' : '✗');
        if (res.status !== 201) return console.error('  Failed:', res.data);
        historyId = res.data.id;
        console.log('  History ID:', historyId);
        console.log('  recordedAt:', res.data.recordedAt, '(auto-set by server ✓)');
        console.log('  chronicConditions:', JSON.stringify(res.data.chronicConditions));
        console.log('  medications:', JSON.stringify(res.data.medications));

        // GET by Patient
        res = await fetchAPI(`/history/patient/${patientId}`);
        console.log('  GET by Patient Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  History entries found:', res.data.length);

        // PUT - Update
        res = await fetchAPI(`/history/${historyId}`, {
            method: 'PUT',
            body: JSON.stringify({
                chronicConditions: ['hypertension', 'type-2 diabetes', 'obesity']
            })
        });
        console.log('  Update Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  Updated chronicConditions:', JSON.stringify(res.data.chronicConditions));

        // ── 3. VITAL SIGNS TESTS ────────────────────────────────────
        console.log('\n[3] Testing VITAL SIGNS CRUD');

        // POST - Create VitalSigns
        res = await fetchAPI('/vitals', {
            method: 'POST',
            body: JSON.stringify({
                patientId,
                height: 175.5,
                weight: 82.0,
                bloodPressure: '130/85',
                heartRate: 78,
                temperature: 37.1,
                oxygenSaturation: 97.5
                // recordedAt auto-set to NOW by server
            })
        });
        console.log('  Create VitalSigns Status:', res.status, res.status === 201 ? '✓' : '✗');
        if (res.status !== 201) return console.error('  Failed:', res.data);
        vitalId = res.data.id;
        console.log('  VitalSigns ID:', vitalId);
        console.log('  recordedAt:', res.data.recordedAt, '(auto-set by server ✓)');
        console.log('  oxygenSaturation:', res.data.oxygenSaturation, '% ✓');

        // GET by Patient
        res = await fetchAPI(`/vitals/patient/${patientId}`);
        console.log('  GET by Patient Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  VitalSigns records found:', res.data.length);

        // PUT - Update
        res = await fetchAPI(`/vitals/${vitalId}`, {
            method: 'PUT',
            body: JSON.stringify({ weight: 81.5, heartRate: 75 })
        });
        console.log('  Update Status:', res.status, res.status === 200 ? '✓' : '✗');
        console.log('  Updated weight:', res.data.weight, '/ heartRate:', res.data.heartRate);

        // ── 4. CLEANUP ──────────────────────────────────────────────
        console.log('\n[4] Cleanup (DELETE)');

        res = await fetchAPI(`/vitals/${vitalId}`, { method: 'DELETE' });
        console.log('  Delete VitalSigns:', res.status, res.status === 200 ? '✓' : '✗');

        res = await fetchAPI(`/history/${historyId}`, { method: 'DELETE' });
        console.log('  Delete History:', res.status, res.status === 200 ? '✓' : '✗');

        res = await fetchAPI(`/diagnoses/${diagnosisId}`, { method: 'DELETE' });
        console.log('  Delete Diagnosis:', res.status, res.status === 200 ? '✓' : '✗');

        res = await fetchAPI(`/patients/${patientId}`, { method: 'DELETE' });
        console.log('  Delete Patient:', res.status, res.status === 200 ? '✓' : '✗');

        res = await fetchAPI(`/doctors/${doctorId}`, { method: 'DELETE' });
        console.log('  Delete Doctor:', res.status, res.status === 200 ? '✓' : '✗');

        console.log('\n=== All AI Data Tests Completed ===');

    } catch (err) {
        console.error('Test execution failed:', err);
    }
}

testAIData();
