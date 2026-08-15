import { Device } from '../models/Device';
import { Activity } from '../models/Activity';
import { NotificationRecord } from '../models/NotificationRecord';
import { CallRecord } from '../models/CallRecord';
import { SmsRecord } from '../models/SmsRecord';
import { SafetyEvent } from '../models/SafetyEvent';
import { ReportRequest } from '../models/ReportRequest';
import { AuditLog } from '../models/AuditLog';

export const runDataRetentionJob = async () => {
  console.log('Starting data retention job...');
  try {
    const devices = await Device.find({}, 'retentionSettings');

    for (const device of devices) {
      if (!device.retentionSettings) continue;

      const { activityDays, notificationDays, callsDays, smsDays, safetyEventsDays } = device.retentionSettings;

      // 1. Activity
      if (activityDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - activityDays);
        await Activity.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
      }

      // 2. Notifications
      if (notificationDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - notificationDays);
        await NotificationRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
      }

      // 3. Calls
      if (callsDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - callsDays);
        await CallRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
      }

      // 4. SMS
      if (smsDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - smsDays);
        await SmsRecord.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
      }

      // 5. Safety Events
      if (safetyEventsDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - safetyEventsDays);
        await SafetyEvent.deleteMany({ deviceId: device._id, timestamp: { $lt: dateLimit } });
      }
    }

    // 6. Reports and Temp Files
    // Report requests expire automatically via TTL index, but we can also actively clean them if TTL is not working
    const expiredReportsDate = new Date();
    expiredReportsDate.setDate(expiredReportsDate.getDate() - 7);
    await ReportRequest.deleteMany({ createdAt: { $lt: expiredReportsDate } });

    // 7. Audit Logs older than 90 days (standard retention)
    const auditLimitDate = new Date();
    auditLimitDate.setDate(auditLimitDate.getDate() - 90);
    await AuditLog.deleteMany({ timestamp: { $lt: auditLimitDate } });
    
    console.log('Data retention job completed successfully.');
  } catch (error) {
    console.error('Error in data retention job:', error);
  }
};

// In a real production environment, this would be scheduled with node-cron.
// For this environment, we export it so server.ts can initialize it with setInterval.
export const startDataRetentionCron = () => {
  // Run once immediately (for testing) then every 24 hours
  runDataRetentionJob();
  setInterval(runDataRetentionJob, 24 * 60 * 60 * 1000);
};
