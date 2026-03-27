/**
 * resetDB.js — MedSmart Database Reset Script
 * Run: node scripts/resetDB.js
 *
 * Deletes the old SQLite files and creates a fresh database.
 */
const fs   = require('fs');
const path = require('path');

const targets = [
    path.join(__dirname, '..', 'data', 'database.sqlite'),
    path.join(__dirname, '..', 'database.sqlite'),   // root-level duplicate, if still exists
];

targets.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted: ${filePath}`);
    }
});

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁  Created: ${dataDir}`);
}

// Touch a fresh empty file
const freshDb = path.join(dataDir, 'database.sqlite');
fs.writeFileSync(freshDb, '');
console.log(`✅  Fresh database created: ${freshDb}`);
console.log('✅  Database wiped. Fresh start.');
console.log('\nRun "node server.js" to re-create all 15 tables automatically.\n');
