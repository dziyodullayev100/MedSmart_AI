/**
 * seed_demo.js - MedSmart Demo Data Seeder (Stub)
 * 
 * Bu fayl backend krash bo'lmasligi uchun yaratildi.
 * Ichida demo ma'lumotlarni qo'shish mantiqi joylashishi mumkin.
 */
const logger = require('./utils/logger');

const seedDemo = async (exitOnComplete = true) => {
    try {
        logger.info('🌱 Demo seeding logic triggered (stub)');
        // Kelajakda bu yerga seeder mantiqini qo'shish mumkin
        if (exitOnComplete) {
            // process.exit(0); // Bu yerda exit qilish tavsiya etilmaydi agar server ichidan chaqirilsa
        }
    } catch (error) {
        logger.error('❌ Seeder error:', error.message);
        if (exitOnComplete) process.exit(1);
    }
};

module.exports = seedDemo;
