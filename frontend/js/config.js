// frontend/js/config.js
// ✅ Production-safe global config for MedSmart frontend
// Loaded BEFORE sync.js and apiClient.js

(function () {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    const isLocal =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        protocol === 'file:';

    // ─── Service URLs ────────────────────────────────────────────────
    // ⚠️  Replace with your actual Render URLs before deploying
    const BACKEND_URL = isLocal
        ? 'http://localhost:5000/api'
        : 'https://medsmart-backend.onrender.com/api';

    const AI_SERVICE_URL = isLocal
        ? 'http://localhost:8000'
        : 'https://medsmart-ai-service.onrender.com';

    // ─── Global Exports ──────────────────────────────────────────────
    // window.API_BASE_URL  → used by apiClient.js
    // window.CONFIG        → used by any other module that needs URLs
    window.API_BASE_URL = BACKEND_URL;
    window.CONFIG = {
        API_BASE_URL: BACKEND_URL,
        AI_SERVICE_URL: AI_SERVICE_URL,
        IS_LOCAL: isLocal,
        ENV: isLocal ? 'development' : 'production'
    };

    console.log(
        `%c[MedSmart Config] ENV: ${window.CONFIG.ENV} | API: ${BACKEND_URL}`,
        'color: #10b981; font-weight: bold;'
    );
})();
