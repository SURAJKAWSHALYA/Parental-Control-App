"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.submitSafetyFeedback = exports.updateSafetyEventStatus = exports.getSafetyOverview = exports.getSafetyEvents = void 0;
const SafetyEvent_1 = require("../models/SafetyEvent");
const SafetyFeedback_1 = require("../models/SafetyFeedback");
const Child_1 = require("../models/Child");
const socketHandler_1 = require("../sockets/socketHandler");
const getSafetyEvents = async (req, res) => {
    try {
        const parentId = req.user?.id;
        const { childId, deviceId, status, severity, source, limit = '50' } = req.query;
        const filter = { parentId };
        if (childId) {
            const child = await Child_1.Child.findOne({ _id: childId, parentId });
            if (!child)
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            filter.childId = childId;
        }
        if (deviceId)
            filter.deviceId = deviceId;
        if (status && status !== 'All')
            filter.status = status;
        if (severity && severity !== 'All')
            filter.severity = severity;
        if (source && source !== 'All')
            filter.source = source;
        const events = await SafetyEvent_1.SafetyEvent.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('childId', 'name')
            .populate('deviceId', 'deviceName');
        res.status(200).json({ success: true, data: events });
    }
    catch (error) {
        console.error('Error getting safety events:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getSafetyEvents = getSafetyEvents;
const getSafetyOverview = async (req, res) => {
    try {
        const parentId = req.user?.id;
        const { childId } = req.query;
        const filter = { parentId, status: { $in: ['NEW', 'REVIEWED'] } };
        if (childId)
            filter.childId = new (require('mongoose').Types.ObjectId)(childId);
        const counts = await SafetyEvent_1.SafetyEvent.aggregate([
            { $match: filter },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
        const overview = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        counts.forEach(c => {
            if (overview.hasOwnProperty(c._id)) {
                overview[c._id] = c.count;
            }
        });
        res.status(200).json({ success: true, data: overview });
    }
    catch (error) {
        console.error('Error getting safety overview:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getSafetyOverview = getSafetyOverview;
const updateSafetyEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isRead } = req.body;
        const parentId = req.user?.id;
        const event = await SafetyEvent_1.SafetyEvent.findOne({ _id: id, parentId });
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        if (status)
            event.status = status;
        if (isRead !== undefined)
            event.isRead = isRead;
        await event.save();
        (0, socketHandler_1.getIo)().to(`parent_${parentId}`).emit('safety:updated', event);
        res.status(200).json({ success: true, data: event });
    }
    catch (error) {
        console.error('Error updating safety event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateSafetyEventStatus = updateSafetyEventStatus;
const submitSafetyFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, reason } = req.body;
        const parentId = req.user?.id;
        const event = await SafetyEvent_1.SafetyEvent.findOne({ _id: id, parentId });
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        const feedback = new SafetyFeedback_1.SafetyFeedback({
            eventId: event._id,
            parentId,
            decision,
            reason
        });
        await feedback.save();
        // Automatically update event status based on decision
        if (decision === 'DISMISSED' || decision === 'INCORRECT') {
            event.status = 'DISMISSED';
        }
        else if (decision === 'RESOLVED') {
            event.status = 'RESOLVED';
        }
        else if (decision === 'CONFIRMED') {
            event.status = 'REVIEWED';
        }
        await event.save();
        (0, socketHandler_1.getIo)().to(`parent_${parentId}`).emit('safety:updated', event);
        res.status(201).json({ success: true, data: feedback });
    }
    catch (error) {
        console.error('Error submitting safety feedback:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.submitSafetyFeedback = submitSafetyFeedback;
const markAllRead = async (req, res) => {
    try {
        const parentId = req.user?.id;
        await SafetyEvent_1.SafetyEvent.updateMany({ parentId, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ success: true, message: 'All marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.markAllRead = markAllRead;
