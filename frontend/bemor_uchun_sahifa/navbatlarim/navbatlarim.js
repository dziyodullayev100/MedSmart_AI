// ============================
// NAVBATLARIM.JS — Yordamchi ma'lumotlar (Asosiy logika navbatlarim.html da)
// ============================

// Sanani formatlash
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Xona raqamlarini qaytarish
function getRoomNumber(serviceType) {
    const roomMapping = {
        'umumiy_shifokor': '101-A', 'pediatr': '102-B', 'ginekolog': '201-A',
        'kardiolog': '202-B', 'nevrolog': '203-A', 'stomatolog': '301-A',
        'oftalmolog': '302-B', 'dermatolog': '303-A', 'usm': 'UZI-1',
        'ekg': 'EKG-1', 'qon_tahlili': 'LAB-1', 'siydik_tahlili': 'LAB-2',
        'vaksinatsiya': '104-B', 'psixolog': '401-A', 'fizioterapiya': 'FIZIO-1'
    };
    return roomMapping[serviceType] || '101-A';
}

// Mutaxassislikka qarab doktorlarni olish
function getDoctorsBySpecialization(specialization) {
    const allDoctors = [
        { id: 101, name: 'Dr. Aliyev Olim', specialization: 'Terapevt', experience: '15 yil', rating: 4.8 },
        { id: 102, name: 'Dr. Karimova Nozima', specialization: 'Terapevt', experience: '12 yil', rating: 4.7 },
        { id: 201, name: 'Dr. Toshpo\'latova Zilola', specialization: 'Pediatr', experience: '10 yil', rating: 4.9 },
        { id: 202, name: 'Dr. Abdullayeva Malika', specialization: 'Pediatr', experience: '8 yil', rating: 4.6 },
        { id: 301, name: 'Dr. Hasanova Zuhra', specialization: 'Ginekolog', experience: '18 yil', rating: 4.9 },
        { id: 302, name: 'Dr. Yusupova Feruza', specialization: 'Ginekolog', experience: '14 yil', rating: 4.8 },
        { id: 401, name: 'Dr. Sharipov Jasur', specialization: 'Kardiolog', experience: '20 yil', rating: 5.0 },
        { id: 402, name: 'Dr. Ismoilova Dildora', specialization: 'Kardiolog', experience: '16 yil', rating: 4.8 },
        { id: 501, name: 'Dr. Tursunov Farhod', specialization: 'Nevrolog', experience: '17 yil', rating: 4.7 },
        { id: 502, name: 'Dr. Qodirova Nigora', specialization: 'Nevrolog', experience: '11 yil', rating: 4.6 },
        { id: 601, name: 'Dr. Samadov Rustam', specialization: 'Stomatolog', experience: '13 yil', rating: 4.9 },
        { id: 602, name: 'Dr. Xamidova Laylo', specialization: 'Stomatolog', experience: '9 yil', rating: 4.7 },
        { id: 701, name: 'Dr. Jabborov Bahrom', specialization: 'Oftalmolog', experience: '19 yil', rating: 4.8 },
        { id: 702, name: 'Dr. Sodiqova Mohira', specialization: 'Oftalmolog', experience: '7 yil', rating: 4.5 },
        { id: 801, name: 'Dr. Nosirova Munisa', specialization: 'Dermatolog', experience: '12 yil', rating: 4.7 },
        { id: 802, name: 'Dr. Karimov Shohrux', specialization: 'Dermatolog', experience: '10 yil', rating: 4.6 },
        { id: 901, name: 'Dr. Abdullayev Sherzod', specialization: 'USM mutaxassisi', experience: '14 yil', rating: 4.9 },
        { id: 902, name: 'Dr. Toshmatova Zarina', specialization: 'USM mutaxassisi', experience: '8 yil', rating: 4.7 },
        { id: 1001, name: 'Dr. Xolmirzayeva Noila', specialization: 'Laboratoriya mutaxassisi', experience: '11 yil', rating: 4.8 },
        { id: 1002, name: 'Dr. G\'aniyeva Madina', specialization: 'Laboratoriya mutaxassisi', experience: '6 yil', rating: 4.5 },
        { id: 1101, name: 'Dr. Nazarova Dilbar', specialization: 'Psixolog', experience: '13 yil', rating: 4.9 },
        { id: 1102, name: 'Dr. Ortiqov Jahongir', specialization: 'Psixolog', experience: '9 yil', rating: 4.7 },
        { id: 1201, name: 'Dr. Toshpo\'latov Bobur', specialization: 'Fizioterapevt', experience: '16 yil', rating: 4.8 },
        { id: 1202, name: 'Dr. Sa\'dullayeva Malohat', specialization: 'Fizioterapevt', experience: '10 yil', rating: 4.6 }
    ];
    return allDoctors.filter(d =>
        d.specialization.toLowerCase().includes(specialization.toLowerCase()) ||
        specialization.toLowerCase().includes(d.specialization.toLowerCase())
    );
}