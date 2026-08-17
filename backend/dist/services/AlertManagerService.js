"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManagerService = void 0;
const Alert_1 = require("../models/Alert");
const AlertRule_1 = require("../models/AlertRule");
class AlertManagerService {
    /**
     * Process and potentially create a new alert, taking into account rules, deduplication, cooldowns, and quiet hours.
     */
    static async processAlert(data) {
        // 1. Fetch Alert Rule
        const rule = await AlertRule_1.AlertRule.findOne({
            parentId: data.parentId,
            childId: data.childId,
            type: data.type
        }) || await AlertRule_1.AlertRule.findOne({
            parentId: data.parentId,
            type: data.type,
            childId: { $exists: false } // Global rule
        });
        if (rule && !rule.enabled) {
            return null; // Alert is disabled
        }
        // Determine effective severity and cooldown
        const severity = rule?.severity || data.severity;
        const cooldownMinutes = rule?.cooldownMinutes || 60; // Default 1 hr cooldown
        // 2. Check Quiet Hours
        if (rule?.quietHours?.enabled && (!rule.quietHours.ignoreCritical || severity !== 'CRITICAL')) {
            if (this.isWithinQuietHours(rule.quietHours.start, rule.quietHours.end)) {
                return null; // Suppressed by quiet hours
            }
        }
        // 3. Deduplication & Cooldown
        const cooldownDate = new Date(Date.now() - cooldownMinutes * 60 * 1000);
        const recentAlert = await Alert_1.Alert.findOne({
            childId: data.childId,
            deviceId: data.deviceId,
            type: data.type,
            isRead: false,
            lastOccurredAt: { $gte: cooldownDate }
        });
        if (recentAlert) {
            recentAlert.count += 1;
            recentAlert.lastOccurredAt = new Date();
            // Escalate severity if count reaches threshold
            const ESCALATION_THRESHOLD = 3;
            if (recentAlert.count >= ESCALATION_THRESHOLD) {
                if (recentAlert.severity === 'LOW')
                    recentAlert.severity = 'MEDIUM';
                else if (recentAlert.severity === 'MEDIUM')
                    recentAlert.severity = 'HIGH';
                else if (recentAlert.severity === 'HIGH')
                    recentAlert.severity = 'CRITICAL';
            }
            await recentAlert.save();
            return recentAlert;
        }
        // 4. Create Alert
        const alert = new Alert_1.Alert({
            ...data,
            severity,
            count: 1,
            lastOccurredAt: new Date()
        });
        await alert.save();
        return alert;
    }
    static isWithinQuietHours(start, end) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + currentMinute / 60;
        const parseTime = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h + m / 60;
        };
        const startTime = parseTime(start);
        const endTime = parseTime(end);
        if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        }
        else {
            // Crosses midnight (e.g. 22:00 to 07:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    }
}
exports.AlertManagerService = AlertManagerService;
