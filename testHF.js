require('dotenv').config({path: 'backend/.env'});
const axios = require('axios');

async function testHuggingFace() {
    console.log("Using key:", process.env.HUGGINGFACE_API_KEY ? "Found" : "Not Found");
    try {
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/v1/chat/completions',
            {
                model: 'mistralai/Mistral-7B-Instruct-v0.3',
                messages: [{ role: 'user', content: 'hello' }],
                max_tokens: 50
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Success:", response.data);
    } catch (e) {
        console.log("Error Details:", e.response ? e.response.data : e.message);
    }
}
testHuggingFace();
