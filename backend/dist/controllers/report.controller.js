"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFamilyCommunicationReport = exports.getCommunicationReport = exports.getSafetyReport = exports.getWeeklyReport = void 0;
const response_1 = require("../utils/response");
const Activity_1 = require("../models/Activity");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const SafetyEvent_1 = require("../models/SafetyEvent");
const CallRecord_1 = require("../models/CallRecord");
const SmsRecord_1 = require("../models/SmsRecord");
const NotificationRecord_1 = require("../models/NotificationRecord");
const Message_1 = require("../models/Message");
const MediaAsset_1 = require("../models/MediaAsset");
const Conversation_1 = require("../models/Conversation");
const getWeeklyReport = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.query;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const deviceQuery = { childId: { $in: childIds } };
        if (deviceId)
            deviceQuery._id = deviceId;
        const devices = await Device_1.Device.find(deviceQuery);
        if (!devices.length)
            return (0, response_1.sendError)(res, 'No devices found or unauthorized', 'NOT_FOUND', 404);
        const targetDeviceIds = devices.map(d => d._id);
        // Date calculations for "Weekly" report (Last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        // Aggregate Location Activity (Number of updates)
        const locationUpdates = await Activity_1.Activity.countDocuments({
            deviceId: { $in: targetDeviceIds },
            type: 'LOCATION',
            timestamp: { $gte: startDate, $lte: endDate }
        });
        // Aggregate Geofence Activity
        const geofenceEvents = await Activity_1.Activity.countDocuments({
            deviceId: { $in: targetDeviceIds },
            type: 'GEOFENCE',
            timestamp: { $gte: startDate, $lte: endDate }
        });
        // Aggregate Places visited (distinct placeIds from geofence metadata)
        const geofenceActivities = await Activity_1.Activity.find({
            deviceId: { $in: targetDeviceIds },
            type: 'GEOFENCE',
            timestamp: { $gte: startDate, $lte: endDate }
        });
        const uniquePlaces = new Set(geofenceActivities.map(a => a.metadata?.placeId));
        const placesVisitedCount = uniquePlaces.size;
        // Aggregate Website blocks
        const blockedWebsites = await Activity_1.Activity.countDocuments({
            deviceId: { $in: targetDeviceIds },
            type: 'WEBSITE',
            'metadata.action': 'BLOCKED',
            timestamp: { $gte: startDate, $lte: endDate }
        });
        const reportData = {
            period: '7 Days',
            startDate,
            endDate,
            statistics: {
                locationUpdates,
                placesVisited: placesVisitedCount,
                geofenceEvents,
                blockedWebsites
            }
        };
        (0, response_1.sendSuccess)(res, reportData, 'Weekly report generated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getWeeklyReport = getWeeklyReport;
const getSafetyReport = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { days = '7' } = req.query;
        const device = await Device_1.Device.findOne({ _id: deviceId }).populate('childId');
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const child = device.childId;
        if (child.parentId.toString() !== parentId.toString()) {
            return (0, response_1.sendError)(res, 'Unauthorized', 'UNAUTHORIZED', 403);
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const events = await SafetyEvent_1.SafetyEvent.find({
            deviceId,
            timestamp: { $gte: startDate }
        });
        const summary = {
            total: events.length,
            CRITICAL: events.filter(e => e.severity === 'CRITICAL').length,
            HIGH: events.filter(e => e.severity === 'HIGH').length,
            MEDIUM: events.filter(e => e.severity === 'MEDIUM').length,
            LOW: events.filter(e => e.severity === 'LOW').length,
        };
        (0, response_1.sendSuccess)(res, summary, 'Safety report generated');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getSafetyReport = getSafetyReport;
const getCommunicationReport = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { days = '7' } = req.query;
        const device = await Device_1.Device.findOne({ _id: deviceId }).populate('childId');
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const child = device.childId;
        if (child.parentId.toString() !== parentId.toString()) {
            return (0, response_1.sendError)(res, 'Unauthorized', 'UNAUTHORIZED', 403);
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const query = { deviceId, timestamp: { $gte: startDate } };
        const [calls, sms, notifications] = await Promise.all([
            CallRecord_1.CallRecord.countDocuments(query),
            SmsRecord_1.SmsRecord.countDocuments(query),
            NotificationRecord_1.NotificationRecord.countDocuments(query)
        ]);
        const summary = {
            calls,
            sms,
            notifications
        };
        (0, response_1.sendSuccess)(res, summary, 'Communication report generated');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getCommunicationReport = getCommunicationReport;
const getFamilyCommunicationReport = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { childId } = req.params;
        const { days = '7' } = req.query;
        const child = await Child_1.Child.findOne({ _id: childId, parentId });
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found or unauthorized', 'UNAUTHORIZED', 403);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        // Get conversation for child
        const conversation = await Conversation_1.Conversation.findOne({ parentId, childId });
        if (!conversation) {
            return (0, response_1.sendSuccess)(res, { messages: 0, photos: 0, videos: 0, safetyEvents: 0, flaggedMedia: 0 }, 'No conversation');
        }
        const conversationId = conversation._id;
        // Messages query
        const [messagesSent, messagesReceived, photos, videos, flaggedMessages, flaggedMedia, safetyEvents] = await Promise.all([
            Message_1.Message.countDocuments({ conversationId, senderType: 'Child', createdAt: { $gte: startDate } }),
            Message_1.Message.countDocuments({ conversationId, senderType: 'Parent', createdAt: { $gte: startDate } }),
            MediaAsset_1.MediaAsset.countDocuments({ conversationId, type: 'IMAGE', createdAt: { $gte: startDate } }),
            MediaAsset_1.MediaAsset.countDocuments({ conversationId, type: 'VIDEO', createdAt: { $gte: startDate } }),
            Message_1.Message.countDocuments({ conversationId, safetyStatus: 'FLAGGED', createdAt: { $gte: startDate } }),
            MediaAsset_1.MediaAsset.countDocuments({ conversationId, safetyStatus: 'FLAGGED', createdAt: { $gte: startDate } }),
            SafetyEvent_1.SafetyEvent.countDocuments({
                childId,
                source: { $in: ['FAMILY_CHAT_MESSAGE', 'FAMILY_CHAT_MEDIA'] },
                timestamp: { $gte: startDate }
            })
        ]);
        const summary = {
            messages: messagesSent + messagesReceived,
            messagesSent,
            messagesReceived,
            photos,
            videos,
            safetyEvents,
            flaggedMessages,
            flaggedMedia
        };
        (0, response_1.sendSuccess)(res, summary, 'Family Communication report generated');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getFamilyCommunicationReport = getFamilyCommunicationReport;
