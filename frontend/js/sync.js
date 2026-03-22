// frontend/js/sync.js
// MedSmart yagona API integratsiya va LocalStorage sinxronizatsiya moduli

/**
 * ==========================================
 * 🔧 API ENVIRONMENT CONFIGURATION
 * ==========================================
 */

// 1. Production (Live) Backend URL
// ALWAYS ensure the domain precisely matches your Render Dashboard. No trailing slashes.
const PROD_API_URL = 'https://medsmart-backend.onrender.com/api';

// 2. Development (Local) Backend URL
const LOCAL_API_URL = 'http://localhost:5000/api';

// 3. Environment Detection
// Detects if the frontend is being viewed locally (Live Server or raw file)
const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:';

// 4. Final API URL Assignment
const API_BASE_URL = isLocalhost ? LOCAL_API_URL : PROD_API_URL;

// Expose globally for other scripts to use
window.API_BASE_URL = API_BASE_URL; 

// Debug log to quickly verify which URL is being used by the browser
console.log(`🌍 Tarmoq holati: ${isLocalhost ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`🔗 Faol API URL: ${API_BASE_URL}`);

/**
 * Serverdan ma'lumotlarni yuklab olib LocalStorage'ga yozadi
 */
async function syncDownload() {
    try {
        console.log("Sinxronizatsiya (Download) boshlandi...");
        const response = await fetch(`${API_BASE_URL}/sync/download`);
        if (!response.ok) throw new Error("Server bilan ulanishda xatolik");
        
        const data = await response.json();
        
        if (data.appointments && data.appointments.length > 0) {
            // Backend dan kelgan navbatlarni lokal formatga o'tkazish
            const formattedApts = data.appointments.map(apt => ({
                id: apt.id,
                bemor_id: apt.Patient ? apt.Patient.id : apt.patientId,
                bemor_fio: apt.patientName || (apt.Patient ? apt.Patient.name : 'Noma\'lum'),
                shifokor: apt.doctorName || (apt.Doctor ? apt.Doctor.name : 'Noma\'lum'),
                xizmat: apt.serviceName || (apt.Service ? apt.Service.name : ''),
                sana: apt.date,
                vaqt: apt.time,
                holati: apt.status || 'upcoming',
                yaratilganSana: apt.createdAt
            }));
            localStorage.setItem('navbatlar', JSON.stringify(formattedApts));
        }
        
        if (data.doctors && data.doctors.length > 0) {
            const formattedDocs = data.doctors.map(d => ({
                id: d.id,
                fio: d.name,
                mutaxassislik: d.specialization,
                tel: d.contact,
                tajriba: d.experience + ' yil',
                soha: d.specialization,
                ishVaqti: d.workingHours,
                status: 'faol'
            }));
            localStorage.setItem('shifokorlar', JSON.stringify(formattedDocs));
        }

        console.log("Sinxronizatsiya (Download) muvaffaqiyatli yakunlandi!");
    } catch (err) {
        console.warn("Backend server ishlamayapti, tizim Oftlayn (LocalStorage) rejimida davom etadi.", err);
    }
}

/**
 * LocalStorage'dagi ma'lumotlarni Serverga yuboradi (Backup)
 */
async function syncUpload() {
    try {
        console.log("Sinxronizatsiya (Upload) boshlandi...");
        
        let navbatlar = JSON.parse(localStorage.getItem('navbatlar') || '[]');
        let shifokorlar = JSON.parse(localStorage.getItem('shifokorlar') || '[]');
        let bemorlar = JSON.parse(localStorage.getItem('barcha_bemorlar') || '[]');

        // Backend kutayotgan formatga o'tkazish
        const payload = {
            appointments: navbatlar.map(n => ({
                id: n.id,
                patientName: n.bemor_fio,
                doctorName: n.shifokor,
                serviceName: n.xizmat || n.service,
                date: n.sana || n.date,
                time: n.vaqt || n.time,
                status: n.holati || n.status,
                patientId: n.bemor_id // Agar mavjud bo'lsa
            })),
            doctors: shifokorlar.map(d => ({
                id: d.id,
                name: d.fio,
                specialization: d.mutaxassislik,
                contact: d.tel,
                experience: parseInt(d.tajriba) || 5,
                workingHours: d.ishVaqti
            })),
            patients: bemorlar.map(b => ({
                id: b.id,
                name: b.fio,
                phone: b.telefon,
                email: b.email,
                password: b.parol // Faqat sync uchun
            }))
        };

        const response = await fetch(`${API_BASE_URL}/sync/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Yuklashda xatolik yuz berdi");
        
        console.log("Sinxronizatsiya (Upload) muvaffaqiyatli bajarildi!");
    } catch (err) {
        console.warn("Upload amalga oshmadi. Ma'lumot LocalStorage da saqlanib turibdi.", err);
    }
}

// Global scope orqali foydalanish uchun
window.syncDownload = syncDownload;
window.syncUpload = syncUpload;
