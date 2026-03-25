const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db');
const { setupAssociations } = require('../config/associations');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const AIPrediction = require('../models/AIPrediction');

async function generateDemoReport() {
    try {
        console.log('🔄 Connecting to Database for Report...');
        await sequelize.authenticate();
        setupAssociations();
        
        const doctorsNum = await Doctor.count();
        const patientsNum = await Patient.count();
        const apptsNum = await Appointment.count();
        const aiNum = await AIPrediction.count();

        // Let's get some recent ai predictions
        const recentMods = await AIPrediction.findAll({ limit: 3, order: [['createdAt', 'DESC']] });
        const recentAppts = await Appointment.findAll({ limit: 5, include: [Patient, Doctor], order: [['createdAt', 'DESC']] });

        let md = `# MedSmart Demo Report\nGenerated: ${new Date().toISOString()}\n\n`;
        md += `## System Stats\n- Doctors: ${doctorsNum}\n- Patients: ${patientsNum}\n- Appointments: ${apptsNum}\n- AI Predictions made: ${aiNum}\n\n`;

        md += `## Sample AI Prediction Results\n`;
        if (recentMods.length > 0) {
            for (const ai of recentMods) {
                md += `- **[${ai.predictionType.toUpperCase()}]** Target Patient ID: ${ai.patientId}\n  Result: ${JSON.stringify(ai.resultData)}\n`;
            }
        } else {
            md += `*No AI predictions logged yet.*\n`;
        }
        
        md += `\n## Recent Activity\n`;
        if (recentAppts.length > 0) {
            for (const a of recentAppts) {
                const patName = a.Patient ? a.Patient.name : 'Unknown';
                const docName = a.Doctor ? a.Doctor.name : 'Unknown';
                md += `- Appointment ${a.id.split('-')[0]}: ${patName} scheduled with ${docName} (${a.status})\n`;
            }
        } else {
            md += `*No appointments booked yet.*\n`;
        }

        md += `\n## Financial Summary\n`;
        md += `Total Revenue: $24,500.00 (Demo Simulation Data)\nPending Payments: $1,200.00\n`;

        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        
        const outPath = path.join(dataDir, 'demo_report.md');
        fs.writeFileSync(outPath, md);

        console.log(`✅ Demo markdown report generated successfully at ${outPath}`);
        
        // Expose graceful exit if run natively from CLI
        if (require.main === module) process.exit(0);

    } catch (error) {
        console.error('❌ Report generating failed', error);
        if (require.main === module) process.exit(1);
    }
}

module.exports = { generateDemoReport };

if (require.main === module) {
    generateDemoReport();
}
