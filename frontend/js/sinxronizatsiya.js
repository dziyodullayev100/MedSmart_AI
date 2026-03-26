// MED SMART - LocalStorage sinxronizatsiya tizimi
// Versiya: 2.0.0 (Hardened with Priority Queue & Conflict Resolution)
// Muallif: MED SMART Development Team

class DataSync {
    constructor() {
        this.syncQueue = JSON.parse(localStorage.getItem('medsmart_sync_queue') || '[]');
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        const status = JSON.parse(localStorage.getItem('medsmart_sync_status') || '{}');
        this.lastSyncTime = status.lastSyncTime ? new Date(status.lastSyncTime) : null;
        this.failedCount = status.failedCount || 0;
        this.pendingCount = this.syncQueue.length;

        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Internet aloqasi tiklandi. Queue ishga tushirildi.');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSync();
        });
        
        window.addEventListener('beforeunload', () => {
            this.syncToServer();
        });
    }

    updateStatus() {
        this.pendingCount = this.syncQueue.length;
        const status = {
            lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
            pendingCount: this.pendingCount,
            failedCount: this.failedCount
        };
        localStorage.setItem('medsmart_sync_status', JSON.stringify(status));
    }
    
    initializeSync() {
        this.loadLocalData();
        if (this.isOnline) {
            this.syncFromServer();
        }
    }
    
    loadLocalData() {
        try {
            return {
                users: JSON.parse(localStorage.getItem('medsmart_users') || '[]'),
                appointments: JSON.parse(localStorage.getItem('medsmart_appointments') || '[]'),
                doctors: JSON.parse(localStorage.getItem('medsmart_doctors') || '[]'),
                services: JSON.parse(localStorage.getItem('medsmart_services') || '[]'),
                patients: JSON.parse(localStorage.getItem('medsmart_patients') || '[]'),
                notifications: JSON.parse(localStorage.getItem('medsmart_notifications') || '[]'),
                vitals: JSON.parse(localStorage.getItem('medsmart_vitals') || '[]'),
                diagnoses: JSON.parse(localStorage.getItem('medsmart_diagnoses') || '[]')
            };
        } catch (error) {
            console.error('Lokal yuklashda xatolik:', error);
            return {};
        }
    }
    
    resolveConflicts(localItems, serverItems) {
        // Each record has updatedAt timestamp. Higher wins.
        const resolved = [];
        const serverMap = new Map();
        serverItems.forEach(item => serverMap.set(item.id, item));

        localItems.forEach(localItem => {
            const serverItem = serverMap.get(localItem.id);
            if (!serverItem) {
                resolved.push(localItem); // Only exists locally
            } else {
                const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
                const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime();
                
                if (localTime > serverTime) {
                    resolved.push(localItem); // Local is newer
                } else {
                    resolved.push(serverItem); // Server is newer or equal (Server wins)
                }
                serverMap.delete(localItem.id);
            }
        });

        // Add remaining server items
        serverMap.forEach(item => resolved.push(item));
        return resolved;
    }

    async syncFromServer() {
        if (this.syncInProgress) return;
        this.syncInProgress = true;
        
        try {
            const response = await this.realAPICall('/sync/download');
            
            if (response && response.success) {
                const local = this.loadLocalData();
                const serverData = response.data || {};
                const mergedData = {};

                // Apply conflict resolution for each category
                Object.keys(local).forEach(key => {
                    const localItems = Array.isArray(local[key]) ? local[key] : [];
                    const serverItems = Array.isArray(serverData[key]) ? serverData[key] : [];
                    mergedData[key] = this.resolveConflicts(localItems, serverItems);
                });

                this.saveLocalData(mergedData);
                this.lastSyncTime = new Date();
                this.updateStatus();
                console.log('Serverdan ma\'lumotlar muvaffaqiyatli tortildi.');
            }
        } catch (error) {
            console.error('Download xatosi:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async syncToServer() {
        if (!this.isOnline || this.syncInProgress) return;
        this.syncInProgress = true;
        
        try {
            const localData = this.loadLocalData();
            const response = await this.realAPICall('/sync/upload', {
                method: 'POST',
                body: JSON.stringify(localData)
            });
            
            if (response && response.success) {
                this.lastSyncTime = new Date();
                this.updateStatus();
            }
        } catch (error) {
            console.error('Serverga yuborish xatosi, navbatga saqlanadi:', error);
            // Queue full snapshot as LOW priority fallback
            this.addToSyncQueue('all', localData, 'LOW');
        } finally {
            this.syncInProgress = false;
        }
    }
    
    getPriorityLevel(category) {
        if (category === 'HIGH') return 1;
        if (category === 'MEDIUM') return 2;
        if (category === 'LOW') return 3;

        if (['vitals', 'diagnoses'].includes(category)) return 1;
        if (['appointments', 'payments'].includes(category)) return 2;
        return 3; 
    }

    addToSyncQueue(category, data, explicitPriority = null) {
        const syncItem = {
            id: Date.now() + Math.random(),
            category: category,
            data: data,
            priority: explicitPriority ? this.getPriorityLevel(explicitPriority) : this.getPriorityLevel(category),
            timestamp: new Date().toISOString(),
            retryCount: 0,
            nextRetry: Date.now()
        };
        
        this.syncQueue.push(syncItem);
        this.syncQueue.sort((a, b) => a.priority - b.priority); 
        this.updateStatus();
        this.saveQueue();
    }
    
    saveQueue() {
        localStorage.setItem('medsmart_sync_queue', JSON.stringify(this.syncQueue));
        this.updateStatus();
    }

    async processSyncQueue() {
        if (this.syncQueue.length === 0 || this.syncInProgress || !this.isOnline) return;
        this.syncInProgress = true;
        
        const now = Date.now();
        const pendingQueue = [];
        
        for (const item of this.syncQueue) {
            if (now < item.nextRetry) {
                pendingQueue.push(item);
                continue;
            }

            try {
                const response = await this.realAPICall('/sync/upload', {
                    method: 'POST',
                    body: JSON.stringify({ [item.category]: Array.isArray(item.data) ? item.data : [item.data] })
                });
                
                if (!response || !response.success) throw new Error('Rad etildi');
                
                console.log(`[Sinxronizatsiya] Muvaffaqiyatli: ${item.category}`);
            } catch (error) {
                item.retryCount++;
                if (item.retryCount < 3) {
                    // Exponential backoff: 1s, 2s, 4s (1000 * 2^(retry-1))
                    const delay = 1000 * Math.pow(2, item.retryCount - 1);
                    item.nextRetry = Date.now() + delay;
                    pendingQueue.push(item);
                } else {
                    this.failedCount++;
                    if (window.notify) window.notify('error', `Ma'lumot uzatishda xatolik (${item.category}). Server rad etdi.`);
                }
            }
        }

        this.syncQueue = pendingQueue;
        this.saveQueue();
        this.syncInProgress = false;
    }
    
    saveLocalData(data) {
        Object.keys(data).forEach(type => {
            if (data[type]) {
                localStorage.setItem(`medsmart_${type}`, JSON.stringify(data[type]));
            }
        });
    }

    async realAPICall(endpoint, options = {}) {
        // Fallback to apiClient if available, otherwise fetch
        if (window.apiClient) {
             const method = options.method || 'GET';
             if (method === 'GET') return window.apiClient.get(endpoint, options.headers, true, true);
             if (method === 'POST') return window.apiClient.post(endpoint, JSON.parse(options.body), options.headers, true);
        }

        const baseUrl = window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:5000/api' : 'https://medsmart-backend.onrender.com/api');
        const url = `${baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Server xatosi');
            return { success: true, data: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

const dataSync = new DataSync();

const SyncManager = {
    saveAppointment: (appointment) => {
        appointment.updatedAt = new Date().toISOString();
        dataSync.addToSyncQueue('appointments', appointment);
    },
    updatePatient: (patientId, data) => {
        const payload = { id: patientId, ...data, updatedAt: new Date().toISOString() };
        dataSync.addToSyncQueue('patients', payload);
        return true;
    },
    addPatient: (patientData) => {
        const newPatient = { id: Date.now(), ...patientData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        dataSync.addToSyncQueue('patients', newPatient);
        return newPatient;
    },
    getSyncStatus: () => {
        return {
            isOnline: dataSync.isOnline,
            lastSync: dataSync.lastSyncTime,
            pendingCount: dataSync.pendingCount,
            failedCount: dataSync.failedCount,
            inProgress: dataSync.syncInProgress
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataSync, SyncManager, dataSync };
} else {
    window.SyncManager = SyncManager;
}
