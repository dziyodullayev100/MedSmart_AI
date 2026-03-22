// frontend/js/config.js
// Global configuration file for Med Smart frontend

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Replace the production URL with the actual backend deployment URL (e.g., Render, AWS)
const PROD_API_URL = 'https://your-medsmart-backend-url.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:5000/api';

window.CONFIG = {
    API_BASE_URL: isLocalhost ? LOCAL_API_URL : PROD_API_URL,
    
    // Replace with actual production AI service URL
    AI_SERVICE_URL: isLocalhost ? 'http://localhost:8000' : 'https://your-medsmart-ai-url.onrender.com'
};
