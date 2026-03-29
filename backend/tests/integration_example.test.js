const axios = require('axios');

async function runIntegrationTest() {
    console.log('--- INTEGRATION TEST: Backend + DB ---');
    
    try {
        console.log('1. Stepping: Checking Backend Health Full...');
        const res = await axios.get('http://localhost:5000/api/health/full');
        console.log('   Response Status:', res.status);
        if (res.data.database === 'ok') {
            console.log('   [PASS] Connection to Database is functional');
        } else {
            console.log('   [FAIL] Database is down');
        }
        
        console.log('\nResult: Integration test completed.');
    } catch (error) {
        console.error('   [FAIL] Integration test failed:', error.message);
    }
}

runIntegrationTest();
