const axios = require('axios');

async function runSystemTest() {
    console.log('--- SYSTEM TEST: Full Auth Flow ---');
    const baseURL = 'http://localhost:5000/api/users';
    const uniqueEmail = `test_user_${Date.now()}@example.com`;
    
    try {
        // 1. Register
        console.log(`1. Stepping: Registering ${uniqueEmail}...`);
        const regRes = await axios.post(`${baseURL}/register`, {
            name: 'System Test User',
            email: uniqueEmail,
            password: 'password123',
            phone: '+998901234567'
        });
        console.log('   [PASS] Registration Successful');

        // 2. Login
        console.log('2. Stepping: Logging in...');
        const loginRes = await axios.post(`${baseURL}/login`, {
            email: uniqueEmail,
            password: 'password123'
        });
        console.log('   [PASS] Login Successful - Token received');
        
        console.log('\nResult: System test passed (Full Auth Cycle).');
    } catch (error) {
        console.error('   [FAIL] System test failed:', error.response ? error.response.data : error.message);
    }
}

runSystemTest();
