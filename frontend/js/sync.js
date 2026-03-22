// frontend/js/sync.js
// MedSmart yagona API integratsiya va LocalStorage sinxronizatsiya moduli

/**
 * ==========================================
 * 🚀 PRODUCTION API & ENVIRONMENT CONFIGURATION
 * ==========================================
 * Barcha frontend API ulanishlari uchun maxsus yagona markaz
 */

// 1. Environment Detection (Ishonaq ishlash muhitini aniqlash)
const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:';

// 2. Define Core Services (Asosiy va kelajakdagi xizmatlar)
const SERVICES = {
    // Asosiy Node.js Backend
    BACKEND: {
        LOCAL: 'http://localhost:5000/api',
        PROD: 'https://medsmart-backend.onrender.com/api' // <- To'g'rilangan manzili
    },
    // Kelajakdagi Sun'iy Intelekt (AI) xizmati uchun tayyorgarlik
    AI: {
        LOCAL: 'http://localhost:8000/api',
        PROD: 'https://medsmart-ai-service.onrender.com/api'
    }
};

// 3. Dynamic URL Assignment (Dinamik taqsimot)
const API_BASE_URL = isLocalhost ? SERVICES.BACKEND.LOCAL : SERVICES.BACKEND.PROD;
const AI_MODEL_URL = isLocalhost ? SERVICES.AI.LOCAL : SERVICES.AI.PROD;

// 4. Global Registration (Barcha boshqa skriptlar ishlata olishi uchun ruxsat)
window.API_BASE_URL = API_BASE_URL;
window.AI_MODEL_URL = AI_MODEL_URL;

// 5. Diagnostic Logging (Brauzer konsolida chiroyli dizayndagi loglar)
console.group('🌍 MedSmart Environment Diagnostics');
console.log(`State:  %c${isLocalhost ? 'LOCAL DEV' : 'PRODUCTION LIVE'}`, 'color: #00ff00; font-weight: bold;');
console.log(`Core API URL:   %c${API_BASE_URL}`, 'color: #00ccff;');
console.log(`AI Service URL: %c${AI_MODEL_URL}`, 'color: #00ccff;');
console.groupEnd();

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
