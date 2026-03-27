# MedSmart Loyihasini Ishga Tushirish Qo'llanmasi

Sizning loyihangiz 3 ta asosiy qismdan iborat. Ular bir-biri bilan uzviy bog'langan bo'lib, loyihaning to'liq va muammosiz ishlashi uchun **ikkita terminal** va **bitta brauzer** oynasi kerak bo'ladi.

---

## 1-QADAM: AI Xizmatini ishga tushirish (Miyani yoqish)
AI qismi bemor belgilarini tahlil qiladi va javob beradi. Bu qism **8000-portda** ishlashi shart.

1. VS Code'da yangi terminal oching (`Ctrl + \``).
2. Quyidagi buyruqlarni yozing:
   ```bash
   cd ai_service
   python run.py
   ```
*(Bu xizmat ishga tushganda "Starting server on http://0.0.0.0:8000" degan yozuv chiqishi kerak)*

---

## 2-QADAM: Backend (Server) ni ishga tushirish (Yurakni yoqish)
Bu qism ma'lumotlar bazasi va frontend o'rtasida ma'lumot tashiydi. Bu qism **5000-portda** ishlashi shart.

1. VS Code'da **ikkinchi** yangi terminal oching (Avvalgisini yopib qo'ymang, yonidan + tugmasini bosib yangi oching).
2. Quyidagi buyruqlarni yozing:
   ```bash
   cd backend
   node server.js
   ```
*(Bu ishga tushganda "Database synchronized" va "Server running on port 5000" degan yozuvlar chiqadi)*

---

## 3-QADAM: Frontendni ochish (Yuzni ko'rish)
Tizim orqa fonda ishlashni boshladi. Endi interfeysni ko'ramiz!

1. Loyihangiz ichidagi `frontend` papkasini oching.
2. Uning ichidagi **`index.html`** faylini toping.
3. Unga sichqonchaning o'ng tugmasini bosib, **"Open with Live Server"** tugmasini bosing (Agar VS Code'da Live Server o'rnatilgan bo'lsa). 
4. Yoki shunchaki `index.html` faylining ustiga ikki marta bossangiz, brauzerda (Chrome/Edge) ochiladi.

---

### Ishlayotganini qanday tekshiramiz?
- Brauzerda veb-sayt ochilgach, pastki o'ng burchakdagi **Yashil Robot (AI Widget)** tugmasini bosing.
- Chatga **"Salom"** deb yozing. 
- Agar AI yordamchisi zudlik bilan sizga javob qaytarsa, tabriklayman! Tizimingizning qon aylanishi mukammal ishlayapti — Frontend so'rovni Backendga, Backend esa AI Servicega uzatib, natijani qaytarib ekranga chiqardi!

### Tayyor akkauntlar (Sinov uchun):
Siz tizimga kirib, bazadagi o'zgarishlarni real vaqtda monitoring qilish uchun quyidagi test parollaridan foydalanib *Login* qilishingiz mumkin:
- **Admin uchun:** `admin@medsmart.uz` / Parol: `Demo1234!`
- **Shifokor:** `dr.karimov@medsmart.uz` / Parol: `Demo1234!`
- **Bemor:** `patient1@medsmart.uz` / Parol: `Demo1234!`
