# MedSmart — AI-Powered Medical Management System

## 🌟 Umumiy Ma'lumot (Overview)
MedSmart — bu zamonaviy tibbiyot muassasalari uchun mo'ljallangan, sun'iy intellekt (AI) tahlillariga asoslangan kompleks boshqaruv platformasi. Tizim Node.js (Backend) va Python FastAPI (AI Service) integratsiyasi orqali bemorlarni ro'yxatga olishdan tortib, ularning salomatligini bashorat qilishgacha bo'lgan jarayonlarni qamrab oladi.

---

## 🚀 Ishga Tushirish Yo'riqnomasi (Quick Start / Installation)

Loyihaning to'liq ishlashi uchun **ikkita terminal** oynasi kerak bo'ladi.

### 1-QADAM: AI Xizmatini ishga tushirish (Miyani yoqish)
AI qismi **8000-portda** ishlashi shart.
1. VS Code'da yangi terminal oching.
2. Quyidagi buyruqlarni yozing:
   ```bash
   cd ai_service
   python run.py
   ```

### 2-QADAM: Backend (Server) ni ishga tushirish (Yurakni yoqish)
Backend qismi **5000-portda** ishlashi shart.
1. VS Code'da ikkinchi terminalni oching.
2. Quyidagi buyruqlarni yozing:
   ```bash
   cd backend
   node server.js
   ```

### 3-QADAM: Frontendni ochish (Yuzni ko'rish)
1. `frontend` papkasidagi **`index.html`** faylini brauzerda oching (yoki Live Server yordamida).

---

## 🛠 Texnologiyalar (Tech Stack)
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3, ApexCharts.
- **Backend:** Node.js, Express.js, Sequelize ORM.
- **AI Service:** Python, FastAPI, Scikit-learn (Machine Learning).
- **Database:** PostgreSQL (Production) / SQLite (Development).

---

## 🧠 AI Modullari
- **Seasonal Prediction (Random Forest):** Faslga qarab kasallik xavfini bashorat qilish.
- **Disease Progression (Apriori):** Bemor tarixi asosida kelajakdagi xavflarni zanjir tahlili orqali topish.
- **Medical Chatbot:** NLP asosidagi o'zbek tilidagi virtual yordamchi.
- **Automated Triage:** Xavf darajasini (High/Medium/Low) avtomat aniqlash.

---

## 📊 Ma'lumotlar Bazasi (Database Guide)
DBeaver yoki boshqa vositalar orqali bazani kuzatishingiz mumkin:
- **Patients:** Bemorlar shaxsiy ma'lumotlari.
- **PatientHistories:** AI tahlili uchun asosiy tibbiy tarix.
- **RiskScores & AIPredictions:** AI hisoblagan natijalar.
- **Vitals:** Bemorning hayotiy ko'rsatkichlari (Qon bosimi, Puls, BMI).

---

## 🧪 Testlash (Testing)
Tizim 3 darajali testdan o'tgan:
1. **Unit Testlar:** Alohida funksiyalarni tekshirish.
2. **Integral Testlar:** Backend va AI Servisining o'zaro aloqasini tekshirish.
3. **Sistem Testlar:** Bemorning tizimga kirishidan tortib bashorat olishigacha bo'lgan to'liq zanjir.

---

## 🖥 Terminal Komandalari (Cheat Sheet)
- `cd ..` - Yuqori papkaga chiqish.
- `ls / dir` - Fayllarni ko'rish.
- `npm install` - Kutubxonalarni o'rnatish (Backend).
- `pip install -r requirements.txt` - AI kutubxonalarini o'rnatish.
- `Ctrl + C` - Ishlayotgan serverni to'xtatish.

---

### Tayyor Akkauntlar:
- **Admin:** `admin@medsmart.uz` / Parol: `Demo1234!`
- **Shifokor:** `dr.karimov@medsmart.uz` / Parol: `Demo1234!`
- **Bemor:** `patient1@medsmart.uz` / Parol: `Demo1234!`

---
**MedSmart Team © 2026**
