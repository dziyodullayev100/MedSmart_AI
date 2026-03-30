const axios = require('axios');

async function runIntegrationAiTest() {
    console.log('--- INTEGRATION TEST 2: Backend + AI Service ---');
    
    try {
        console.log('1. Stepping: Checking Backend AI Microservice Health...');
        const res = await axios.get('http://localhost:5000/api/health/full');
        console.log('   Response Status:', res.status);
        
        if (res.data.ai === 'ok') {
            console.log('   [PASS] Connection to Python AI Service is functional');
        } else {
            console.log('   [FAIL] AI Service is unreachable through Backend');
        }
        
        console.log('\nResult: Second Integration test completed successfully.');
    } catch (error) {
        console.error('   [FAIL] Integration test failed:', error.message);
    }
}

runIntegrationAiTest();
