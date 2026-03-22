const axios = require('axios');

async function testAuth() {
    try {
        const baseURL = 'http://localhost:5000/api/users';
        console.log('1. Testing Register...');
        const registerRes = await axios.post(`${baseURL}/register`, {
            name: 'Test Bemor',
            email: 'test@bemor.com',
            password: 'password123',
            phone: '+998901234567'
        });
        console.log('Register Success:', registerRes.data);
        
        const token = registerRes.data.token;
        
        console.log('\n2. Testing Login...');
        const loginRes = await axios.post(`${baseURL}/login`, {
            email: 'test@bemor.com',
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data);
        
        console.log('\n3. Testing Update Profile...');
        const updateRes = await axios.put(`${baseURL}/profile`, {
            name: 'Test Bemor Updated',
            phone: '+998901112233',
            id: 'hacker-id' // testing that ID doesn't change
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Update Success:', updateRes.data);
        
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }
    }
}

testAuth();
