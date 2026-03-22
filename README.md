# MedSmart0 - Medical Management System

## Tavsif
MedSmart0 - bu bemorlar, shifokorlar, uchrashuvlar va xizmatlarni boshqarish uchun to'liq tibbiyot boshqaruv tizimi.

## O'rnatish
1. Papkani kompyuteringizga ko'chiring
2. Backend papkasiga o'ting: `cd backend`
3. Dependenciyalarni o'rnating: `npm install`
4. Serverni ishga tushuring: `npm start`

## Tuzilma
```
Med_Smart0/
├── backend/                 # Node.js backend
│   ├── config/             # Konfiguratsiya fayllari
│   ├── controllers/        # Kontrollerlar
│   ├── middlewares/         # Middlewarelar
│   ├── models/            # Ma'lumotlar modellari
│   ├── routes/            # API marshrutlari
│   ├── package.json      # Node.js konfiguratsiyasi
│   └── server.js         # Asosiy server fayli
└── frontend/              # Frontend fayllari
    ├── admin_uchun_sahifa/    # Admin interfeysi
    ├── bemor_uchun_sahifa/    # Bemor interfeysi
    ├── css/                   # Stil fayllari
    ├── js/                    # JavaScript fayllari
    ├── rasmlar/               # Rasmlar
    └── index.html             # Asosiy sahifa
```

## API Endpoints
- `GET /api/doctors` - Shifokorlar ro'yxati
- `POST /api/doctors` - Yangi shifokor qo'shish
- `GET /api/patients` - Bemorlar ro'yxati
- `POST /api/patients` - Yangi bemor qo'shish
- `GET /api/appointments` - Uchrashuvlar ro'yxati
- `POST /api/appointments` - Yangi uchrashuv qo'shish
- `GET /api/services` - Xizmatlar ro'yxati
- `POST /api/services` - Yangi xizmat qo'shish

## Sinxronizatsiya
- `GET /api/sync/download` - Ma'lumotlarni yuklash
- `POST /api/sync/upload` - Ma'lumotlarni yuborish

## Ishga tushirish
1. Serverni ishga tushiring: `npm start`
2. Brauzerda oching: `http://localhost:5000`

## Texnologiyalar
- **Backend**: Node.js, Express, Sequelize, SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Ma'lumotlar bazasi**: SQLite

## Muallif
MedSmart0 Development Team
