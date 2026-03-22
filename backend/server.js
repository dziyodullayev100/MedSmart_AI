const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
// Updated DB imports to use the newly exported sequelize instance and connect method
const { sequelize, connectDB } = require('./config/db');
const medSmartRoutes = require('./routes/medSmartRoutes');
const syncRoutes = require('./routes/syncRoutes');
const errorHandler = require('./middlewares/errorHandler');

// Import models to ensure they're registered with Sequelize
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Service = require('./models/Service');
const Payment = require('./models/Payment');
const Diagnosis = require('./models/Diagnosis');
const PatientHistory = require('./models/PatientHistory');
const VitalSigns = require('./models/VitalSigns');
const AIPrediction = require('./models/AIPrediction');
const { setupAssociations } = require('./config/associations');

// Load env vars
dotenv.config();

// Connect to SQLite DB
connectDB();

// Setup model associations
setupAssociations();

// Automatically sync models to create tables if they don't exist
sequelize.sync().then(() => {
    console.log("Database synchronized");
});


const app = express();

// CORS middleware
app.use(cors());

// Body parser
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount routers
app.use('/api', medSmartRoutes);
app.use('/api/sync', syncRoutes);
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Custom Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
