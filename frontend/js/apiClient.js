/**
 * frontend/js/apiClient.js
 * Senior-level API Wrapper for MedSmart Production System
 * 
 * UPGRADED FEATURES (Module 5):
 * - Token Refresh Integration
 * - Request Queue (during refresh)
 * - Response Caching (60s for GET)
 * - Offline Detection (queueing writes)
 */

const injectApiStyles = () => {
    if (document.getElementById('api-client-styles')) return;
    const style = document.createElement('style');
    style.id = 'api-client-styles';
    style.innerHTML = `
        #api-global-loader {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255, 255, 255, 0.6); z-index: 99999;
            backdrop-filter: blur(2px); 
            display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        #api-global-loader.active {
            opacity: 1; pointer-events: all;
        }
        .api-spinner {
            width: 50px; height: 50px;
            border: 5px solid rgba(0, 150, 255, 0.2);
            border-top: 5px solid #0096FF;
            border-radius: 50%;
            animation: api-spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
        }
        @keyframes api-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
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
        .api-toast.show { transform: translateY(0); opacity: 1; }
        .api-toast.error { background: linear-gradient(135deg, #ff4d4d, #c0392b); }
        .api-toast.success { background: linear-gradient(135deg, #2ed573, #218c53); }
        .api-toast.warning { background: linear-gradient(135deg, #ffa502, #e67e22); }
        .api-toast.info { background: linear-gradient(135deg, #1e90ff, #005cbf); }
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
    TIMEOUT_MS: 12000,
    activeRequests: 0,
    isRefreshing: false,
    refreshQueue: [],
    MAX_QUEUE_SIZE: 10,
    requestCache: new Map(),
    CACHE_EXPIRY: 60000, // 60s
    offlineQueue: JSON.parse(localStorage.getItem('medsmart_offline_queue') || '[]'),
    isOnline: navigator.onLine,

    initUI() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectApiStyles();
                createUIBlocks();
                this.setupOfflineListeners();
            });
        } else {
            injectApiStyles();
            createUIBlocks();
            this.setupOfflineListeners();
        }
    },

    setupOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('✅ Internet aloqasi tiklandi. Kiritilgan ma\'lumotlar yuklanmoqda...', 'success');
            this.flushOfflineQueue();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('⚠️ Internet aloqasi uzildi! Tizim offline rejimida ishlayapti.', 'warning');
        });
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
        if (!container) return; 
        
        const toast = document.createElement('div');
        toast.className = `api-toast ${type}`;
        toast.innerText = message;
        
        container.appendChild(toast);
        
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.add('show'), 10);
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); 
        }, 5000);
    },

    getCacheKey(url, options) {
        return `${options.method || 'GET'}_${url}`;
    },

    clearCachePrefix(baseUrl) {
        // Clear all cached keys starting with the base endpoint
        for (const key of this.requestCache.keys()) {
            if (key.includes(baseUrl)) {
                this.requestCache.delete(key);
            }
        }
    },

    async handleTokenRefresh() {
        if (!window.tokenManager) return true; // Auth logic missing, skip
        
        let token = window.tokenManager.getAccessToken();
        
        // If token expires soon, trigger refresh
        if (window.tokenManager.willExpireSoon(token)) {
            if (!this.isRefreshing) {
                this.isRefreshing = true;
                const success = await window.tokenManager.refreshAccessToken();
                this.isRefreshing = false;
                
                // Flush the memory queue
                while (this.refreshQueue.length > 0) {
                    const cb = this.refreshQueue.shift();
                    cb(success ? window.tokenManager.getAccessToken() : null);
                }
                return success;
            } else {
                // Wait in queue
                return new Promise(resolve => {
                    if (this.refreshQueue.length >= this.MAX_QUEUE_SIZE) {
                        resolve(false); // Drop if queue full
                    } else {
                        this.refreshQueue.push((newToken) => resolve(!!newToken));
                    }
                });
            }
        }
        return true;
    },

    async processAction(endpoint, options, isRetry = false) {
        const baseUrl = window.API_BASE_URL;
        if (!baseUrl) {
            this.showToast('Tizim sozlamalarida jiddiy xatolik.', 'error');
            return null; 
        }

        const url = `${baseUrl}${endpoint}`;
        const cacheKey = this.getCacheKey(url, options);

        // 1. Check Cache (GET only)
        const isGet = !options.method || options.method === 'GET';
        if (isGet && !options.forceRefresh && this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.time < this.CACHE_EXPIRY) {
                return cached.data;
            } else {
                this.requestCache.delete(cacheKey);
            }
        }

        // 2. Token Injection & Refresh Verification
        const refreshed = await this.handleTokenRefresh();
        if (!refreshed && !isRetry) {
            this.showToast('Sessiya yakunlandi', 'warning');
            return null;
        }

        if (window.tokenManager && window.tokenManager.getAccessToken()) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${window.tokenManager.getAccessToken()}`;
        }

        // 3. Offline Mode handling
        if (!this.isOnline) {
            if (isGet) {
                // If GET offline, return cached even if expired
                if (this.requestCache.has(cacheKey)) return this.requestCache.get(cacheKey).data;
                this.showToast('Tarmoqqa ulanmagansiz. Keshlangan ma\'lumot topilmadi.', 'warning');
                return null;
            } else {
                // Queue POST/PUT/DELETE
                this.offlineQueue.push({ endpoint, options, time: Date.now() });
                localStorage.setItem('medsmart_offline_queue', JSON.stringify(this.offlineQueue));
                this.showToast('Siz offlinesiz. Jeryon navbatga qo\'yildi (Tarmoq kelganda jo\'natiladi).', 'info');
                return { success: true, queued: true }; // Mock success
            }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                // Retry once on 401
                if (response.status === 401 && !isRetry) {
                    if (window.tokenManager) await window.tokenManager.refreshAccessToken();
                    return this.processAction(endpoint, options, true); // Retry 1x
                }

                if (response.status === 401 && isRetry) {
                    if (window.secureLogout) window.secureLogout();
                    this.showToast('Sessiyangiz haqiqiy emas.', 'error');
                    return null;
                }

                if (response.status >= 500) {
                    this.showToast('Serverda ichki xatolik yuz berdi (500).', 'error');
                } else {
                    const errPayload = await response.json().catch(() => ({}));
                    this.showToast(errPayload.message || 'Xatolik rad etildi.', 'error');
                }
                return null;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            // 4. Update Cache Mechanism
            if (isGet) {
                this.requestCache.set(cacheKey, { data, time: Date.now() });
            } else {
                // Invalidate Cache for this base path magically on Write Ops
                const routeBase = url.split('/').slice(0, 4).join('/');
                this.clearCachePrefix(routeBase);
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                this.showToast('Server uxlab qolgan yoki javob bermayapti.', 'warning');
            } else {
                this.showToast('Internet/Tarmoq xatosi.', 'error');
            }
            return null;
        }
    },

    async flushOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        localStorage.removeItem('medsmart_offline_queue');

        for (const req of queue) {
            await this.processAction(req.endpoint, req.options);
        }
    },

    async request(endpoint, options = {}, disableLoader = false) {
        if (!disableLoader) this.showLoader();
        const result = await this.processAction(endpoint, options);
        if (!disableLoader) this.hideLoader();
        return result;
    },

    async get(endpoint, headers = {}, forceRefresh = false, disableLoader = false) { 
        return this.request(endpoint, { method: 'GET', headers, forceRefresh }, disableLoader); 
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

window.apiClient.initUI();
