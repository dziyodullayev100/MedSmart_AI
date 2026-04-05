# MedSmart AI: Loyiha Tahlili va Bozor Strategiyasi

Ushbu hujjat loyihaning texnik arxitekturasi, biznes modeli va bozor tahlilini (TAM/SAM/SOM) o'z ichiga oladi.

---

## 🏗 Loyiha Strukturasi (Architecture)

MedSmart3-tier (uch qatlamli) mikroservis arxitekturasida qurilgan:

1. **Frontend (Foydalanuvchi interfeysi):**
   - **Admin/Shifokor Paneli:** Tushumlar, bemorlar oqimi va xizmatlar boshqaruvi.
   - **Bemor Kabineti:** Shaxsiy navbatlar, to'lovlar va AI bashoratlarni ko'rish.
   - **AI Diagnostika Sahifasi:** Grafiklar va chatbot interfeysi.

2. **Backend (Node.js & Express):**
   - **User Controller:** JWT orqali autentifikatsiya (Role-Based Access Control).
   - **MedSmart Controller:** CRUD amallari (Shifokor, Bemor, Navbatlar).
   - **AI Integratsiya:** Node.js backend Python AI xizmati uchun "ko'prik" vazifasini o'taydi.
   - **Sync System:** Lokal va onlayn malumotlarni sinxronizatsiya qilish.

3. **AI Service (Python FastAPI):**
   - **Random Forest:** Mavsum-kasallik korrelyatsiyasini (Season Prediction) hisoblaydi.
   - **Apriori Algorithm:** Kasalliklar o'rtasidagi yashirin klinik bog'liqliklarni (Progression) topadi.
   - **NLP Engine:** O'zbek tilidagi simptomlarni tushunish va triage o'tkazish.

---

## 📈 Bozor Tahlili (Market Analysis)

TAM/SAM/SOM modeli loyihaning moliyaviy salohiyatini ($2.6 mln/yil) isbotlab beradi.

### 1. TAM (Total Addressable Market) - $1.97 Milliard (Umumiy bozor)
O'zbekistondagi 39.4 million aholining yillik o'rtacha tibbiy xarajatlari ($50/kishi) asosida hisoblangan.

### 2. SAM (Serviceable Addressable Market) - $137.5 Million (Raqamli bozor)
27.5 Million smartfon foydalanuvchilari va raqamli xizmatlarga ochiq qatlam.

### 3. SOM (Serviceable Obtainable Market) - $2.6 Million (Yillik daromad maqsadi)
Dastlabki 3 yil ichida raqobatchilardan real egallanadigan ulush.
- **B2C ($2.3M):** Premium obunalar orqali ($12/yil).
- **B2B ($0.3M):** Shifoxonalar uchun SaaS obunasi ($960/yil).

---

## 🎯 Loyiha Vazifalari va Maqsadlari
1. **Bemorlarni boshqarish:** Shaxsiy profillar va raqamli tibbiy kartalar yaratish.
2. **Navbatlar tizimi:** Onlayn qabul rejalashtirish va monitoring.
3. **AI Diagnostika:** Kasalliklarni erta aniqlash va xavf darajasini (Risk Score) baholash.
4. **Xavfsizlik:** Ma'lumotlarni shifrlash va audit loglash (Audit Logs).

---

## 🛤 Kelajakdagi Rejalar (Roadmap)
- **1-Bosqich:** JWT Auth va RBAC integratsiyasini to'liq yakunlash.
- **2-Bosqich:** Telegram Bot va SMS xabarnomalar tizimi.
- **3-Bosqich:** Mobil ilova (Flutter/React Native) ishlab chiqish.
- **4-Bosqich:** WebRTC orqali shifokor bilan video-konsultatsiya.

---
**Muallif:** Antigravity AI (Project Analytics Team)
**Sana:** 2026-04-05
