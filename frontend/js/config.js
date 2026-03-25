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

    // ─── Global Fetch Interceptor (Security & Synchronization) ──────
    // Automatically heals legacy code calling "fetch('/api/...')" or "localhost"
    if (!window.originalFetch) {
        window.originalFetch = window.fetch;
        window.fetch = async function(url, options) {
            if (typeof url === 'string') {
                // 1. Kill any hardcoded localhosts
                url = url.replace('http://localhost:5000', BACKEND_URL.replace('/api', ''));
                url = url.replace('http://localhost:8000', AI_SERVICE_URL);

                // 2. Fix relative /api/ paths bypassing cross-origin
                if (url.startsWith('/api/')) {
                    url = BACKEND_URL + url.substring(4);
                }
            }
            return window.originalFetch(url, options);
        };
    }
})();
