/**
 * frontend/js/stateManager.js
 * Central App State Management (Redux/Vuex style) for vanilla JS.
 * 
 * Auto-persists layout, ui configuration, and lightweight cache.
 */

class StateManager {
    constructor() {
        this.listeners = new Map();
        
        // Default blueprint
        this.state = {
            user: { id: null, name: '', email: '', role: '', isLoggedIn: false },
            appointments: { list: [], lastFetched: null },
            doctors: { list: [], lastFetched: null },
            notifications: { count: 0, items: [] },
            ui: { isLoading: false, currentPage: '' }
        };
        
        this.restoreState();
    }

    // Subscribe to specific section slice
    subscribe(section, callback) {
        if (!this.listeners.has(section)) {
            this.listeners.set(section, new Set());
        }
        this.listeners.get(section).add(callback);
    }

    // Unsubscribe from section slice
    unsubscribe(section, callback) {
        if (this.listeners.has(section)) {
            this.listeners.get(section).delete(callback);
        }
    }

    // Read state slice (deep copy to prevent direct mutations)
    getState(section) {
        if (!this.state[section]) return null;
        return JSON.parse(JSON.stringify(this.state[section])); 
    }

    // Write state slice
    setState(section, data) {
        if (!this.state[section]) this.state[section] = {};

        // Deep merge updates
        this.state[section] = { ...this.state[section], ...data };

        // Console Log under DEV
        if (window.CONFIG && window.CONFIG.ENV === 'development') {
            console.log(`♻️ [StateMgr] Updated '${section}':`, this.state[section]);
        }

        this.notifyListeners(section);
        this.persistState();
    }

    // Fire events across the app for reactive DOM updates
    notifyListeners(section) {
        if (this.listeners.has(section)) {
            for (const callback of this.listeners.get(section)) {
                callback(this.getState(section));
            }
        }
    }

    // Soft Session Persistence
    persistState() {
        // We never persist raw passwords or active Tokens here (xavfsizlik holds auth!)
        const safeState = {
            user: this.state.user,
            notifications: this.state.notifications,
            ui: this.state.ui
        };
        sessionStorage.setItem('medsmart_app_state', JSON.stringify(safeState));
    }

    // Load from Session on F5 / Page reload
    restoreState() {
        try {
            const saved = sessionStorage.getItem('medsmart_app_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (e) {
            console.error('State Manager failed to restore state:', e);
        }
    }

    // Full system wipe (on Logout)
    resetState() {
        this.state = {
            user: { id: null, name: '', email: '', role: '', isLoggedIn: false },
            appointments: { list: [], lastFetched: null },
            doctors: { list: [], lastFetched: null },
            notifications: { count: 0, items: [] },
            ui: { isLoading: false, currentPage: '' }
        };
        sessionStorage.removeItem('medsmart_app_state');
        
        // Notify all sections of zero state
        for (const section of Object.keys(this.state)) {
            this.notifyListeners(section);
        }
    }
}

// Singleton global object
window.appState = new StateManager();
