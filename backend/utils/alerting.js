const logger = require('./logger');

/**
 * Basic Alerting System
 * Trigger alerts based on system thresholds.
 */

// State tracking for deduplication
const activeAlerts = new Map();
const ALERT_COOLDOWN = 10 * 60 * 1000; // 10 minutes

function triggerAlert(alertName, message, severity = 'warning') {
    const now = Date.now();
    const lastAlert = activeAlerts.get(alertName);
    
    if (lastAlert && (now - lastAlert) < ALERT_COOLDOWN) {
        return; // Ignore, currently in cooldown
    }
    
    activeAlerts.set(alertName, now);
    
    // Broadcast via logger
    logger.error(`[ALERT / ${severity.toUpperCase()}] ${alertName}: ${message}`);
    console.error(`🚨 ALERT: ${alertName} -> ${message}`);
}

function checkAlerts(metrics) {
    if (!metrics) return;

    // 1. Memory checks
    if (metrics.memoryUsagePercent > 0.85) {
        triggerAlert('MEMORY_HIGH_WARNING', `Memory usage exceeded 85% (${Math.round(metrics.memoryUsagePercent*100)}%)`, 'warning');
    }

    // 2. Error rate constraints
    if (metrics.errorsPerMinute > 10) {
        triggerAlert('ERROR_STORM_CRITICAL', `High error rate detected: ${metrics.errorsPerMinute} err/min`, 'critical');
    }

    // 3. AI Service Checks
    if (metrics.aiStatus !== 'healthy') {
        const aiDowntime = activeAlerts.get('AI_DOWN_TRACKER') || Date.now();
        activeAlerts.set('AI_DOWN_TRACKER', aiDowntime);
        if ((Date.now() - aiDowntime) > 2 * 60 * 1000) {
            triggerAlert('AI_SERVICE_DOWN_CRITICAL', 'AI Service unresponsive for over 2 minutes', 'critical');
        }
    } else {
        activeAlerts.delete('AI_DOWN_TRACKER');
    }

    // 4. DB Time constraints
    if (metrics.dbResponseTimeMs > 1000) {
        triggerAlert('DB_SLOW_QUERY_WARNING', `Database response threshold breached: ${metrics.dbResponseTimeMs}ms`, 'warning');
    }
}

module.exports = { checkAlerts };
