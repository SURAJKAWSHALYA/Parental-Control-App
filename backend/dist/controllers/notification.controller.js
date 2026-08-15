"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getNotificationCounts = exports.getNotifications = exports.processNotification = void 0;
const Device_1 = require("../models/Device");
const Child_1 = require("../models/Child");
const NotificationRecord_1 = require("../models/NotificationRecord");
const Activity_1 = require("../models/Activity");
const socketHandler_1 = require("../sockets/socketHandler");
const SafetyEventService_1 = require("../services/SafetyEventService");
// Determines category based on package name or app name
const determineCategory = (packageName) => {
    const social = ['com.instagram.android', 'com.facebook.katana', 'com.twitter.android', 'com.zhiliaoapp.musically'];
    const messaging = ['com.whatsapp', 'org.telegram.messenger', 'com.facebook.orca', 'com.discord'];
    const email = ['com.google.android.gm', 'com.microsoft.office.outlook'];
    const system = ['android', 'com.android.systemui', 'com.android.settings'];
    if (social.includes(packageName))
        return 'Social';
    if (messaging.includes(packageName))
        return 'Messaging';
    if (email.includes(packageName))
        return 'Email';
    if (system.includes(packageName))
        return 'System';
    return 'Other';
};
const determineSensitivity = (text, category) => {
    if (!text)
        return false;
    const sensitiveKeywords = ['password', 'code', 'verify', 'urgent', 'payment', 'transfer'];
    return sensitiveKeywords.some(keyword => text.toLowerCase().includes(keyword));
};
const processNotification = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { packageName, appName, notificationTitle, notificationText, timestamp } = req.body;
        const device = await Device_1.Device.findById(deviceId);
        if (!device)
            return res.status(404).json({ success: false, message: 'Device not found' });
        if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized device access' });
        }
        if (device.notificationSettings?.enabled === false) {
            return res.status(200).json({ success: true, message: 'Notification monitoring is disabled' });
        }
        const category = determineCategory(packageName);
        const isSensitive = determineSensitivity(notificationText, category);
        const record = new NotificationRecord_1.NotificationRecord({
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
        const activity = new Activity_1.Activity({
            childId: device.childId,
            deviceId,
            type: 'NOTIFICATION',
            title: 'Notification received',
            description: `Notification from ${appName}`,
            metadata: { packageName, category }
        });
        await activity.save();
        // Notify parent
        const child = await Child_1.Child.findById(device.childId);
        if (child) {
            (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('notification:new', record);
            (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('activity:new', activity);
            // Analyze safety
            if (notificationText) {
                await SafetyEventService_1.SafetyEventService.processTextEvent(child.parentId, child._id, deviceId, 'Notification', notificationText, notificationTitle || 'Notification', 'Notification Content', { packageName, category });
            }
        }
        res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error('Error processing notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.processNotification = processNotification;
const getNotifications = async (req, res) => {
    try {
        const { childId, deviceId, category, days } = req.query;
        // verify parent ownership
        if (childId) {
            const child = await Child_1.Child.findById(childId);
            if (!child || child.parentId.toString() !== req.user?.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }
        else {
            // Must fetch only children owned by parent
            const children = await Child_1.Child.find({ parentId: req.user?.id });
            const childIds = children.map(c => c._id);
            req.query.childId = { $in: childIds };
        }
        const filter = {};
        if (req.query.childId)
            filter.childId = req.query.childId;
        if (deviceId)
            filter.deviceId = deviceId;
        if (category && category !== 'All')
            filter.category = category;
        if (days) {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            filter.timestamp = { $gte: date };
        }
        const notifications = await NotificationRecord_1.NotificationRecord.find(filter)
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('childId', 'name')
            .populate('deviceId', 'deviceName');
        res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getNotifications = getNotifications;
const getNotificationCounts = async (req, res) => {
    try {
        const { childId, deviceId } = req.query;
        const filter = {};
        if (childId) {
            const child = await Child_1.Child.findById(childId);
            if (!child || child.parentId.toString() !== req.user?.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
            filter.childId = new (require('mongoose').Types.ObjectId)(childId);
        }
        else {
            const children = await Child_1.Child.find({ parentId: req.user?.id });
            const childIds = children.map(c => c._id);
            filter.childId = { $in: childIds };
        }
        if (deviceId)
            filter.deviceId = new (require('mongoose').Types.ObjectId)(deviceId);
        const counts = await NotificationRecord_1.NotificationRecord.aggregate([
            { $match: filter },
            { $group: { _id: '$appName', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const formattedCounts = counts.map(c => ({
            appName: c._id,
            count: c.count
        }));
        res.status(200).json({ success: true, data: formattedCounts });
    }
    catch (error) {
        console.error('Error getting notification counts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getNotificationCounts = getNotificationCounts;
const updateSettings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { enabled, retentionDays } = req.body;
        const device = await Device_1.Device.findById(deviceId).populate('childId');
        if (!device)
            return res.status(404).json({ success: false, message: 'Device not found' });
        const child = device.childId;
        if (child.parentId.toString() !== req.user?.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        device.notificationSettings = { enabled, retentionDays };
        await device.save();
        res.status(200).json({ success: true, data: device.notificationSettings });
    }
    catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateSettings = updateSettings;
