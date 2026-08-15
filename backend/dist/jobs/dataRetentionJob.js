"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDataRetentionCron = exports.runDataRetentionJob = void 0;
const Device_1 = require("../models/Device");
const Activity_1 = require("../models/Activity");
const NotificationRecord_1 = require("../models/NotificationRecord");
const CallRecord_1 = require("../models/CallRecord");
const SmsRecord_1 = require("../models/SmsRecord");
const SafetyEvent_1 = require("../models/SafetyEvent");
const ReportRequest_1 = require("../models/ReportRequest");
const AuditLog_1 = require("../models/AuditLog");
const runDataRetentionJob = async () => {
    console.log('Starting data retention job...');
    try {
        const devices = await Device_1.Device.find({}, 'retentionSettings');
        for (const device of devices) {
            if (!device.retentionSettings)
                continue;
            const { activityDays, notificationDays, callsDays, smsDays, safetyEventsDays } = device.retentionSettings;
            // 1. Activity
            if (activityDays) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - activityDays);
                await Activity_1.Activity.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
            }
            // 2. Notifications
            if (notificationDays) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - notificationDays);
                await NotificationRecord_1.NotificationRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
            }
            // 3. Calls
            if (callsDays) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - callsDays);
                await CallRecord_1.CallRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
            }
            // 4. SMS
            if (smsDays) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - smsDays);
                await SmsRecord_1.SmsRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
            }
            // 5. Safety Events
            if (safetyEventsDays) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - safetyEventsDays);
                await SafetyEvent_1.SafetyEvent.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
            }
        }
        // 6. Reports and Temp Files
        // Report requests expire automatically via TTL index, but we can also actively clean them if TTL is not working
        const expiredReportsDate = new Date();
        expiredReportsDate.setDate(expiredReportsDate.getDate() - 7);
        await ReportRequest_1.ReportRequest.deleteMany({ createdAt: { $lt: expiredReportsDate } });
        // 7. Audit Logs older than 90 days (standard retention)
        const auditLimitDate = new Date();
        auditLimitDate.setDate(auditLimitDate.getDate() - 90);
        await AuditLog_1.AuditLog.deleteMany({ timestamp: { $lt: auditLimitDate } });
        console.log('Data retention job completed successfully.');
    }
    catch (error) {
        console.error('Error in data retention job:', error);
    }
};
exports.runDataRetentionJob = runDataRetentionJob;
// In a real production environment, this would be scheduled with node-cron.
// For this environment, we export it so server.ts can initialize it with setInterval.
const startDataRetentionCron = () => {
    // Run once immediately (for testing) then every 24 hours
    (0, exports.runDataRetentionJob)();
    setInterval(exports.runDataRetentionJob, 24 * 60 * 60 * 1000);
};
exports.startDataRetentionCron = startDataRetentionCron;
