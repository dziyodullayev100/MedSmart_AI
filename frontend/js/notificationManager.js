/**
 * frontend/js/notificationManager.js
 * Advanced App Notifications (Polling, Queuing, Audio Alerts, State Integration)
 */

class NotificationManager {
    constructor() {
        this.queue = [];
        this.history = [];
        this.pollInterval = 60000; // 60 seconds
        this.timer = null;
        this.audioContext = null;

        // Auto-start polling if state is initialized
        document.addEventListener('DOMContentLoaded', () => {
            this.startPolling();
        });
    }

    // Lazy initialization of AudioContext due to browser autoplay policies
    initAudio() {
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.warn('Web Audio API not supported in this browser.');
            }
        }
    }

    // Generates a dynamic synthetic "Emergency" beep using the Web Audio API
    playEmergencyAlert() {
        this.initAudio();
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime); // High pitch
        osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    startPolling() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.fetchRemoteNotifications(), this.pollInterval);
        // Do an immediate fetch on startup
        setTimeout(() => this.fetchRemoteNotifications(), 2000);
    }

    async fetchRemoteNotifications() {
        // Skip if offline or no apiClient available
        if (!window.apiClient || !navigator.onLine) return;
        
        try {
            // Disable loader blocks specifically for background polling
            const response = await window.apiClient.get('/notifications', {}, true, true);
            if (response && response.data && Array.isArray(response.data)) {
                response.data.forEach(note => {
                    this.addNotification(note.type || 'info', note.message || note.title, note.duration, note.id);
                });
            }
        } catch (error) {
            // Silently fail remote polling 
        }
    }

    addNotification(type, message, duration = 5000, remoteId = null) {
        const id = remoteId || `local_${Date.now()}_${Math.random()}`;
        
        const notification = {
            id, type, message, timestamp: Date.now()
        };

        this.queue.push(notification);
        this.history.unshift(notification);
        if (this.history.length > 20) this.history.pop(); // Keep only last 20
        
        // Push state update if StateManager is available
        if (window.appState) {
            const currentCount = window.appState.getState('notifications').count || 0;
            window.appState.setState('notifications', {
                count: currentCount + 1,
                items: this.history
            });
        }

        // Render visually
        if (window.apiClient && typeof window.apiClient.showToast === 'function') {
            const visualType = type === 'emergency' ? 'error' : type;
            // Native Toast handler doesn't support "no auto-dismiss" out of the box,
            // but for emergencies we play a loud sound and ensure it gets logged.
            window.apiClient.showToast(message, visualType);
        }

        // Trigger Emergency protocols
        if (type === 'emergency') {
            this.playEmergencyAlert();
            console.error('🚨 [EMERGENCY NOTIFICATION]', message);
            // In a deeper UI integration, you would render a permanent modal here
        }
        
        return id;
    }

    removeNotification(id) {
        this.queue = this.queue.filter(n => n.id !== id);
    }

    clearAll() {
        this.queue = [];
        this.history = [];
        if (window.appState) {
            window.appState.setState('notifications', { count: 0, items: [] });
        }
    }
}

// Instantiate globally
window.notificationManager = new NotificationManager();

// Expose the requested global shorthand
window.notify = function(type, message, duration) {
    if (window.notificationManager) {
        window.notificationManager.addNotification(type, message, duration);
    } else {
        console.warn(`[notifyFallback] ${type.toUpperCase()}:`, message);
    }
};
