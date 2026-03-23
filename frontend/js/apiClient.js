/**
 * frontend/js/apiClient.js
 * Senior-level API Wrapper for MedSmart Production System
 * 
 * UPGRADED FEATURES (Automated UI):
 * - Auto-Spinner: Blocks UI input intelligently via a full-screen CSS loader during any fetch().
 * - Auto-Toasts: Dynamic beautiful error notifications slide up from the bottom right on 400/500/Timeouts.
 * - Zero Configuration: The CSS and HTML are injected straight into the DOM on script load. No HTML changes needed!
 */

const injectApiStyles = () => {
    if (document.getElementById('api-client-styles')) return;
    const style = document.createElement('style');
    style.id = 'api-client-styles';
    style.innerHTML = `
        /* Non-blocking Auto-Spinner */
        #api-global-loader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.6); z-index: 99999;
            backdrop-filter: blur(2px); /* Modern frosted glass effect */
            display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        #api-global-loader.active {
            opacity: 1; pointer-events: all; /* Blocks user clicks during load */
        }
        .api-spinner {
            width: 50px; height: 50px;
            border: 5px solid rgba(0, 150, 255, 0.2);
            border-top: 5px solid #0096FF;
            border-radius: 50%;
            animation: api-spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
        }
        @keyframes api-spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        
        /* Slide-up Toasts Container */
        #api-toast-container {
            position: fixed; bottom: 30px; right: 30px; z-index: 100000;
            display: flex; flex-direction: column; gap: 12px; pointer-events: none;
        }
        .api-toast {
            min-width: 250px; max-width: 350px; padding: 16px 20px; border-radius: 8px;
            color: white; font-family: 'Segoe UI', sans-serif; font-size: 15px; font-weight: 500;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transform: translateY(100px); opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            pointer-events: all;
        }
        /* State Modifiers */
        .api-toast.show { transform: translateY(0); opacity: 1; }
        .api-toast.error { background: linear-gradient(135deg, #ff4d4d, #c0392b); }
        .api-toast.success { background: linear-gradient(135deg, #2ed573, #218c53); }
        .api-toast.warning { background: linear-gradient(135deg, #ffa502, #e67e22); }
    `;
    document.head.appendChild(style);
};

const createUIBlocks = () => {
    if (!document.getElementById('api-global-loader')) {
        const loader = document.createElement('div');
        loader.id = 'api-global-loader';
        loader.innerHTML = '<div class="api-spinner"></div>';
        document.body.appendChild(loader);
    }
    if (!document.getElementById('api-toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'api-toast-container';
        document.body.appendChild(toastContainer);
    }
};

window.apiClient = {
    // 12-second timeout to handle initial Render server awakening delays
    TIMEOUT_MS: 12000,
    activeRequests: 0, // Request tracker for overlapping calls

    initUI() {
        // Guarantee DOM is ready before injecting UI nodes
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectApiStyles();
                createUIBlocks();
            });
        } else {
            injectApiStyles();
            createUIBlocks();
        }
    },

    showLoader() {
        this.activeRequests++;
        const loader = document.getElementById('api-global-loader');
        if (loader) loader.classList.add('active');
    },

    hideLoader() {
        this.activeRequests--;
        if (this.activeRequests <= 0) {
            this.activeRequests = 0;
            const loader = document.getElementById('api-global-loader');
            if (loader) loader.classList.remove('active');
        }
    },

    showToast(message, type = 'error') {
        const container = document.getElementById('api-toast-container');
        if (!container) return; // Failsafe if DOM isn't ready
        
        const toast = document.createElement('div');
        toast.className = `api-toast ${type}`;
        toast.innerText = message;
        
        container.appendChild(toast);
        
        // Trigger physics-based slide-in animation
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.add('show'), 10);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for slide-out transition
        }, 5000);
    },

    // ------------------------------------------
    // CORE REQUEST HANDLER
    // ------------------------------------------

    async request(endpoint, options = {}, disableLoader = false) {
        const baseUrl = window.API_BASE_URL;
        if (!baseUrl) {
            console.error('❌ [API Client] CRITICAL: window.API_BASE_URL is missing.');
            this.showToast('Tizim sozlamalarida jiddiy xatolik.', 'error');
            return null; 
        }

        // 1. Un-hide the global Loading Spinner
        if (!disableLoader) this.showLoader();

        const url = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            console.log(`📡 [API Request] Init -> ${options.method || 'GET'} ${endpoint}`);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                signal: controller.signal // Connect the timeout breaker
            });

            clearTimeout(timeoutId); // Network succeeded, defuse the timeout

            // 2. Safely Trap HTTP Response Errors
            if (!response.ok) {
                console.error(`❌ [API Error] HTTP ${response.status} on ${endpoint}`);
                
                // Smart UI Toasts based on Status Code
                if (response.status === 401) {
                    this.showToast('Sessiya yakunlandi. Iltimos qayta tizinga kiring.', 'warning');
                } else if (response.status >= 500) {
                    this.showToast('Serverda ichki xatolik yuz berdi (500).', 'error');
                } else {
                    this.showToast(`Xatolik: So'rov rad etildi (${response.status})`, 'error');
                }
                
                return null;
            }

            // 3. Safe JSON Parsing
            const text = await response.text();
            return text ? JSON.parse(text) : {};

        } catch (error) {
            clearTimeout(timeoutId);
            
            // 4. Trap and notify timeouts and network crashes
            if (error.name === 'AbortError') {
                console.error(`⏱️ [API Timeout] ${endpoint} exceeded ${this.TIMEOUT_MS}ms.`);
                this.showToast('Server uxlab qolgan yoki javob bermayapti. Iltimos kuting.', 'warning');
            } else {
                console.error(`❌ [Network Crash] Failed to route to ${endpoint}.`, error.message);
                this.showToast('Sayt tarmog\'ga ulana olmadi. Internetni tekshiring.', 'error');
            }
            
            return null;

        } finally {
            // 5. Always hide the global Loader when request ends (even if failed!)
            if (!disableLoader) this.hideLoader();
        }
    },

    // ==========================================
    // SYNTAX SUGAR METHODS
    // ==========================================

    async get(endpoint, headers = {}, disableLoader = false) { 
        return this.request(endpoint, { method: 'GET', headers }, disableLoader); 
    },
    async post(endpoint, body, headers = {}, disableLoader = false) { 
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers }, disableLoader); 
    },
    async put(endpoint, body, headers = {}, disableLoader = false) { 
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }, disableLoader); 
    },
    async delete(endpoint, headers = {}, disableLoader = false) { 
        return this.request(endpoint, { method: 'DELETE', headers }, disableLoader); 
    }
};

// Start UI Injection Engine
window.apiClient.initUI();
console.log('🛡️ [API Client] Global Loaders & Toasts fully initialized.');
