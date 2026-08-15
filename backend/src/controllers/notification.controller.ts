import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { Child } from '../models/Child';
import { NotificationRecord } from '../models/NotificationRecord';
import { Activity } from '../models/Activity';
import { getIo } from '../sockets/socketHandler';
import { SafetyEventService } from '../services/SafetyEventService';

// Determines category based on package name or app name
const determineCategory = (packageName: string): string => {
  const social = ['com.instagram.android', 'com.facebook.katana', 'com.twitter.android', 'com.zhiliaoapp.musically'];
  const messaging = ['com.whatsapp', 'org.telegram.messenger', 'com.facebook.orca', 'com.discord'];
  const email = ['com.google.android.gm', 'com.microsoft.office.outlook'];
  const system = ['android', 'com.android.systemui', 'com.android.settings'];

  if (social.includes(packageName)) return 'Social';
  if (messaging.includes(packageName)) return 'Messaging';
  if (email.includes(packageName)) return 'Email';
  if (system.includes(packageName)) return 'System';
  return 'Other';
};

const determineSensitivity = (text: string | undefined, category: string): boolean => {
  if (!text) return false;
  const sensitiveKeywords = ['password', 'code', 'verify', 'urgent', 'payment', 'transfer'];
  return sensitiveKeywords.some(keyword => text.toLowerCase().includes(keyword));
};

export const processNotification = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { packageName, appName, notificationTitle, notificationText, timestamp } = req.body;

    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized device access' });
    }

    if (device.notificationSettings?.enabled === false) {
       return res.status(200).json({ success: true, message: 'Notification monitoring is disabled' });
    }

    const category = determineCategory(packageName);
    const isSensitive = determineSensitivity(notificationText, category);

    const record = new NotificationRecord({
      childId: device.childId,
      deviceId,
      packageName,
      appName,
      notificationTitle,
      notificationText,
      category,
      isSensitive,
      timestamp: timestamp || new Date()
    });

    await record.save();

    // Log Activity
    const activity = new Activity({
      childId: device.childId,
      deviceId,
      type: 'NOTIFICATION',
      title: 'Notification received',
      description: `Notification from ${appName}`,
      metadata: { packageName, category }
    });
    await activity.save();

    // Notify parent
    const child = await Child.findById(device.childId);
    if (child) {
      getIo().to(`parent_${child.parentId}`).emit('notification:new', record);
      getIo().to(`parent_${child.parentId}`).emit('activity:new', activity);
      
      // Analyze safety
      if (notificationText) {
        await SafetyEventService.processTextEvent(
          child.parentId,
          child._id,
          deviceId,
          'Notification',
          notificationText,
          notificationTitle || 'Notification',
          'Notification Content',
          { packageName, category }
        );
      }
    }

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { childId, deviceId, category, days } = req.query;
    
    // verify parent ownership
    if (childId) {
      const child = await Child.findById(childId);
      if (!child || child.parentId.toString() !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else {
      // Must fetch only children owned by parent
      const children = await Child.find({ parentId: req.user?.id });
      const childIds = children.map(c => c._id);
      req.query.childId = { $in: childIds } as any;
    }

    const filter: any = {};
    if (req.query.childId) filter.childId = req.query.childId;
    if (deviceId) filter.deviceId = deviceId;
    if (category && category !== 'All') filter.category = category;

    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days as string));
      filter.timestamp = { $gte: date };
    }

    const notifications = await NotificationRecord.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('childId', 'name')
      .populate('deviceId', 'deviceName');

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getNotificationCounts = async (req: Request, res: Response) => {
  try {
    const { childId, deviceId } = req.query;

    const filter: any = {};
    if (childId) {
      const child = await Child.findById(childId);
      if (!child || child.parentId.toString() !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      filter.childId = new (require('mongoose').Types.ObjectId)(childId as string);
    } else {
      const children = await Child.find({ parentId: req.user?.id });
      const childIds = children.map(c => c._id);
      filter.childId = { $in: childIds };
    }

    if (deviceId) filter.deviceId = new (require('mongoose').Types.ObjectId)(deviceId as string);

    const counts = await NotificationRecord.aggregate([
      { $match: filter },
      { $group: { _id: '$appName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formattedCounts = counts.map(c => ({
      appName: c._id,
      count: c.count
    }));

    res.status(200).json({ success: true, data: formattedCounts });
  } catch (error) {
    console.error('Error getting notification counts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { enabled, retentionDays } = req.body;

    const device = await Device.findById(deviceId).populate('childId');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const child: any = device.childId;
    if (child.parentId.toString() !== req.user?.id) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    device.notificationSettings = { enabled, retentionDays };
    await device.save();

    res.status(200).json({ success: true, data: device.notificationSettings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
