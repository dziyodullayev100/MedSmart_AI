// MED SMART - LocalStorage sinxronizatsiya tizimi
// Versiya: 1.0.0
// Muallif: MED SMART Development Team

// LocalStorage sinxronizatsiya klassi
class DataSync {
    constructor() {
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        
        // Event listenerlarni o'rnatish
        this.setupEventListeners();
    }
    
    // Event listenerlarni o'rnatish
    setupEventListeners() {
        // Online/Offline statusni kuzatish
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Internet aloqasi tiklandi');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Internet aloqasi uzildi');
        });
        
        // Sahifa yuklanishida sinxronizatsiyani boshlash
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSync();
        });
        
        // Sahifadan chiqishda sinxronizatsiya qilish
        window.addEventListener('beforeunload', () => {
            this.syncToServer();
        });
    }
    
    // Sinxronizatsiyani boshlash
    initializeSync() {
        const lastSync = localStorage.getItem('medsmart_last_sync');
        if (lastSync) {
            this.lastSyncTime = new Date(lastSync);
        }
        
        // Avval saqlangan ma'lumotlarni yuklash
        this.loadLocalData();
        
        // Agar online bo'lsa, server bilan sinxronizatsiya qilish
        if (this.isOnline) {
            this.syncFromServer();
        }
    }
    
    // Lokal ma'lumotni yuklash
    loadLocalData() {
        try {
            const localData = {
                users: JSON.parse(localStorage.getItem('medsmart_users') || '[]'),
                appointments: JSON.parse(localStorage.getItem('medsmart_appointments') || '[]'),
                doctors: JSON.parse(localStorage.getItem('medsmart_doctors') || '[]'),
                services: JSON.parse(localStorage.getItem('medsmart_services') || '[]'),
                patients: JSON.parse(localStorage.getItem('medsmart_patients') || '[]'),
                notifications: JSON.parse(localStorage.getItem('medsmart_notifications') || '[]')
            };
            
            console.log('Lokal ma\'lumotlar yuklandi:', localData);
            return localData;
        } catch (error) {
            console.error('Lokal ma\'lumotlarni yuklashda xatolik:', error);
            return {};
        }
    }
    
    // Serverdan sinxronizatsiya qilish
    async syncFromServer() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            // Real loyihada bu yerda API chaqiruvlari bo'ladi
            const response = await this.realAPICall('/sync/download');
            
            if (response.success) {
                // Serverdagi ma'lumotlarni lokal saqlash
                this.saveLocalData(response.data);
                this.lastSyncTime = new Date();
                localStorage.setItem('medsmart_last_sync', this.lastSyncTime.toISOString());
                
                console.log('Serverdan ma\'lumotlar muvaffaqiyatli sinxronizatsiya qilindi');
                this.showNotification('Ma\'lumotlar yangilandi', 'success');
            }
        } catch (error) {
            console.error('Serverdan sinxronizatsiyada xatolik:', error);
            this.showNotification('Sinxronizatsiyada xatolik yuz berdi', 'error');
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // Serverga sinxronizatsiya qilish
    async syncToServer() {
        if (!this.isOnline || this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            const localData = this.loadLocalData();
            
            // Real loyihada bu yerda API chaqiruvlari bo'ladi
            const response = await this.realAPICall('/sync/upload', {
                method: 'POST',
                body: JSON.stringify(localData)
            });
            
            if (response.success) {
                console.log('Lokal ma\'lumotlar serverga muvaffaqiyatli yuborildi');
                this.lastSyncTime = new Date();
                localStorage.setItem('medsmart_last_sync', this.lastSyncTime.toISOString());
            }
        } catch (error) {
            console.error('Serverga sinxronizatsiyada xatolik:', error);
            // Sinxronizatsiya navbatga qo'shish
            this.addToSyncQueue(localData);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // Sinxronizatsiya navbatiga qo'shish
    addToSyncQueue(data) {
        const syncItem = {
            id: Date.now(),
            data: data,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };
        
        this.syncQueue.push(syncItem);
        localStorage.setItem('medsmart_sync_queue', JSON.stringify(this.syncQueue));
        
        console.log('Ma\'lumot sinxronizatsiya navbatiga qo\'shildi');
    }
    
    // Sinxronizatsiya navbatini qayta ishlash
    async processSyncQueue() {
        if (this.syncQueue.length === 0 || this.syncInProgress) return;
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        localStorage.setItem('medsmart_sync_queue', JSON.stringify(this.syncQueue));
        
        for (const item of queue) {
            try {
                const response = await this.realAPICall('/sync/upload', {
                    method: 'POST',
                    body: JSON.stringify(item.data)
                });
                
                if (response.success) {
                    console.log(`Navbatdagi ma'lumot sinxronizatsiya qilindi: ${item.id}`);
                } else {
                    throw new Error('Server xatosi');
                }
            } catch (error) {
                console.error(`Navbatdagi ma'lumotni sinxronizatsiyalashda xatolik: ${item.id}`, error);
                
                // Qayta urinishlar sonini tekshirish
                item.retryCount++;
                if (item.retryCount < 3) {
                    this.syncQueue.push(item);
                }
            }
        }
    }
    
    // Lokal ma'lumotni saqlash
    saveLocalData(data) {
        const dataTypes = ['users', 'appointments', 'doctors', 'services', 'patients', 'notifications'];
        
        dataTypes.forEach(type => {
            if (data[type]) {
                localStorage.setItem(`medsmart_${type}`, JSON.stringify(data[type]));
            }
        });
    }
    
    // Admin tomonidan kiritilgan navbatlarni saqlash
    saveAdminAppointment(appointment) {
        const appointments = JSON.parse(localStorage.getItem('medsmart_appointments') || '[]');
        const newAppointment = {
            id: Date.now(),
            ...appointment,
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
            synced: false
        };
        
        appointments.push(newAppointment);
        localStorage.setItem('medsmart_appointments', JSON.stringify(appointments));
        
        // Bemorlar kabinetida ko'rish uchun
        this.notifyPatients(newAppointment);
        
        // Serverga sinxronizatsiya qilish
        this.syncToServer();
        
        console.log('Admin navbati saqlandi:', newAppointment);
        return newAppointment;
    }
    
    // Bemorlarni yangi navbat haqida ogohlantirish
    notifyPatients(appointment) {
        const patients = JSON.parse(localStorage.getItem('medsmart_patients') || '[]');
        const relevantPatients = patients.filter(patient => 
            appointment.patientIds && appointment.patientIds.includes(patient.id)
        );
        
        relevantPatients.forEach(patient => {
            const notification = {
                id: Date.now(),
                patientId: patient.id,
                type: 'appointment',
                title: 'Yangi navbat',
                message: `Sizga ${appointment.date} kuni ${appointment.time} da navbat belgilandi.`,
                data: appointment,
                read: false,
                createdAt: new Date().toISOString()
            };
            
            this.addNotification(notification);
        });
    }
    
    // Bildirishnomalarni qo'shish
    addNotification(notification) {
        const notifications = JSON.parse(localStorage.getItem('medsmart_notifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('medsmart_notifications', JSON.stringify(notifications));
        
        // Real vaqtda bildirishnomani ko'rsatish
        this.showRealTimeNotification(notification);
    }
    
    // Real vaqtda bildirishnomani ko'rsatish
    showRealTimeNotification(notification) {
        // Browser bildirishnomalari ruxsatini tekshirish
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/rasmlar/logo.jpg',
                tag: notification.id.toString()
            });
        }
        
        // Toast bildirishnomasi
        this.showToast(notification.message, notification.type);
    }
    
    // Toast bildirishnomasi
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `data-sync-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Real API chaqiruvi
    async realAPICall(endpoint, options = {}) {
        const baseUrl = '/api'; // Backend API base URL
        const url = `${baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Server xatosi');
            }
            
            return {
                success: true,
                data: data,
                message: 'Muvaffaqiyatli'
            };
        } catch (error) {
            console.error('API chaqiruvida xatolik:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Bildirishnomalar uchun ruxsat so'rash
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Bildirishnomalar uchun ruxsat berildi');
                }
            });
        }
    }
}

// Global sinxronizatsiya obyekti
const dataSync = new DataSync();

// Export qilinadigan funksiyalar
const SyncManager = {
    // Admin navbatini saqlash
    saveAppointment: (appointment) => dataSync.saveAdminAppointment(appointment),
    
    // Bemor ma'lumotlarini yangilash
    updatePatient: (patientId, data) => {
        const patients = JSON.parse(localStorage.getItem('medsmart_patients') || '[]');
        const patientIndex = patients.findIndex(p => p.id === patientId);
        
        if (patientIndex !== -1) {
            patients[patientIndex] = {
                ...patients[patientIndex],
                ...data,
                updatedAt: new Date().toISOString(),
                synced: false
            };
            
            localStorage.setItem('medsmart_patients', JSON.stringify(patients));
            dataSync.syncToServer();
            
            console.log('Bemor ma\'lumotlari yangilandi:', patients[patientIndex]);
            return true;
        }
        
        return false;
    },
    
    // Yangi bemor qo'shish
    addPatient: (patientData) => {
        const patients = JSON.parse(localStorage.getItem('medsmart_patients') || '[]');
        const newPatient = {
            id: Date.now(),
            ...patientData,
            createdAt: new Date().toISOString(),
            synced: false
        };
        
        patients.push(newPatient);
        localStorage.setItem('medsmart_patients', JSON.stringify(patients));
        dataSync.syncToServer();
        
        console.log('Yangi bemor qo\'shildi:', newPatient);
        return newPatient;
    },
    
    // Bildirishnomalarni olish
    getNotifications: (patientId = null) => {
        const notifications = JSON.parse(localStorage.getItem('medsmart_notifications') || '[]');
        
        if (patientId) {
            return notifications.filter(n => n.patientId === patientId);
        }
        
        return notifications;
    },
    
    // Bildirishnomani o'qilgan deb belgilash
    markNotificationRead: (notificationId) => {
        const notifications = JSON.parse(localStorage.getItem('medsmart_notifications') || '[]');
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
            notifications[notificationIndex].read = true;
            notifications[notificationIndex].readAt = new Date().toISOString();
            
            localStorage.setItem('medsmart_notifications', JSON.stringify(notifications));
            dataSync.syncToServer();
        }
    },
    
    // Sinxronizatsiya holatini olish
    getSyncStatus: () => {
        return {
            isOnline: dataSync.isOnline,
            lastSync: dataSync.lastSyncTime,
            queueLength: dataSync.syncQueue.length,
            inProgress: dataSync.syncInProgress
        };
    }
};

// Sahifa yuklanishida bildirishnomalar uchun ruxsat so'rash
document.addEventListener('DOMContentLoaded', () => {
    dataSync.requestNotificationPermission();
});

// Export qilish (boshqa fayllarda ishlash uchun)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataSync, SyncManager, dataSync };
}
