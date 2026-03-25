const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const backupsDir = path.join(__dirname, '..', 'data', 'backups');
const dbFile = path.join(__dirname, '..', 'data', 'database.sqlite');

const createBackup = () => {
    try {
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 16);
        const backupFile = path.join(backupsDir, `backup_${timestamp}.sqlite`);

        if (fs.existsSync(dbFile)) {
            fs.copyFileSync(dbFile, backupFile);
            logger.info(`Database backup created: ${backupFile}`);

            // Keep only last 7 backups
            const files = fs.readdirSync(backupsDir)
                .filter(f => f.endsWith('.sqlite'))
                .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time);

            if (files.length > 7) {
                for (let i = 7; i < files.length; i++) {
                    fs.unlinkSync(path.join(backupsDir, files[i].name));
                    logger.info(`Deleted old backup: ${files[i].name}`);
                }
            }
        } else {
            logger.warn('Database file not found. Skipping backup. (Postgres might be in use)');
        }
    } catch (error) {
        logger.error('Database backup failed', { error: error.message });
    }
};

const scheduleBackup = () => {
    logger.info('Database backup scheduled every 24 hours');
    setInterval(createBackup, 24 * 60 * 60 * 1000);
};

module.exports = { createBackup, scheduleBackup };
