const os = require('os');
const axios = require('axios');
const { sequelize } = require('../config/db');
const { checkAlerts } = require('./alerting');

class SystemMonitor {
    constructor() {
        this.metricsBuffer = [];
        this.MAX_BUFFER = 60; // Keep last 60 minutes
        
        // Activity counters for the minute slice
        this.minuteReqCount = 0;
        this.minuteErrorCount = 0;

        // Express Middleware Hook hooks
        this.trackRequest = this.trackRequest.bind(this);
        this.trackError = this.trackError.bind(this);
    }

    trackRequest(req, res, next) {
        this.minuteReqCount++;
        next();
    }

    trackError(err, req, res, next) {
        this.minuteErrorCount++;
        if (next) next(err);
    }

    async collectMetrics() {
        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const memoryUsagePercent = memoryUsage.rss / totalMem;

        const cpus = os.cpus();
        let idle = 0;
        let total = 0;
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                total += cpu.times[type];
            }
            idle += cpu.times.idle;
        });
        const cpuUsagePercent = 1 - (idle / total);

        let activeDBConnections = 0;
        let dbResponseTimeMs = 0;
        const dbStart = Date.now();
        try {
            await sequelize.query('SELECT 1');
            dbResponseTimeMs = Date.now() - dbStart;
            // SQLite specific approximation - if using Postgres change to pg_stat_activity count
            activeDBConnections = 1; 
        } catch(e) { /* ignore */ }

        let aiStatus = 'down', aiTimeMs = 0;
        try {
            const aiStart = Date.now();
            await axios.get(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 3000 });
            aiTimeMs = Date.now() - aiStart;
            aiStatus = 'healthy';
        } catch(e) { }

        const currentMetrics = {
            timestamp: new Date().toISOString(),
            memoryUsagePercent,
            cpuUsagePercent,
            activeDBConnections,
            dbResponseTimeMs,
            requestsPerMinute: this.minuteReqCount,
            errorsPerMinute: this.minuteErrorCount,
            aiStatus,
            aiTimeMs
        };

        // Reset trackers
        this.minuteReqCount = 0;
        this.minuteErrorCount = 0;

        // Save into buffer
        this.metricsBuffer.push(currentMetrics);
        if (this.metricsBuffer.length > this.MAX_BUFFER) {
            this.metricsBuffer.shift(); 
        }

        // Trigger auto alerts processing
        checkAlerts(currentMetrics);
    }

    start() {
        // Collect every 60 seconds
        setInterval(() => this.collectMetrics(), 60000);
        this.collectMetrics(); // collect instantly upon boot
    }

    getMetrics() {
        return this.metricsBuffer;
    }
}

const monitor = new SystemMonitor();

module.exports = monitor;
