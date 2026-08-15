"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSms = exports.getCalls = exports.syncSms = exports.syncCall = void 0;
const Device_1 = require("../models/Device");
const Child_1 = require("../models/Child");
const CallRecord_1 = require("../models/CallRecord");
const SmsRecord_1 = require("../models/SmsRecord");
const Activity_1 = require("../models/Activity");
const SafetyEventService_1 = require("../services/SafetyEventService");
const socketHandler_1 = require("../sockets/socketHandler");
const crypto_1 = __importDefault(require("crypto"));
const hashNumber = (num) => {
    return crypto_1.default.createHash('sha256').update(num).digest('hex').substring(0, 16);
};
const syncCall = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { type, duration, timestamp, contactLabel, rawNumber } = req.body;
        const device = await Device_1.Device.findById(deviceId);
        if (!device)
            return res.status(404).json({ success: false, message: 'Device not found' });
        if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized device access' });
        }
        const numberHash = rawNumber ? hashNumber(rawNumber) : 'UNKNOWN';
        const record = new CallRecord_1.CallRecord({
            childId: device.childId,
            deviceId,
            type,
            duration: duration || 0,
            timestamp: timestamp || new Date(),
            contactLabel,
            numberHash
        });
        await record.save();
        // Log Activity
        const activity = new Activity_1.Activity({
            childId: device.childId,
            deviceId,
            type: 'CALL',
            title: `${type === 'INCOMING' ? 'Incoming' : type === 'OUTGOING' ? 'Outgoing' : 'Missed'} call`,
            description: `${type} call with ${contactLabel || 'Unknown'} (${duration || 0}s)`,
            metadata: { type, duration, contactLabel }
        });
        await activity.save();
        // Notify parent
        const child = await Child_1.Child.findById(device.childId);
        if (child) {
            (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('call:new', record);
            (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('activity:new', activity);
        }
        res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error('Error syncing call:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.syncCall = syncCall;
const syncSms = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { type, rawSender, fullMessage, timestamp } = req.body;
        const device = await Device_1.Device.findById(deviceId);
        if (!device)
            return res.status(404).json({ success: false, message: 'Device not found' });
        if (req.user && req.user.role === 'child' && device.childId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized device access' });
        }
        const senderHash = rawSender ? hashNumber(rawSender) : 'UNKNOWN';
        const messagePreview = fullMessage ? fullMessage.substring(0, 100) : '';
        const child = await Child_1.Child.findById(device.childId);
        if (!child)
            return res.status(404).json({ success: false, message: 'Child not found' });
        const { classification: safetyClassification } = await SafetyEventService_1.SafetyEventService.processTextEvent(child.parentId, child._id, deviceId, 'SMS', fullMessage || '', `SMS Safety Alert`, 'SMS Content', { senderHash });
        const record = new SmsRecord_1.SmsRecord({
            childId: device.childId,
            deviceId,
            type,
            senderHash,
            messagePreview,
            timestamp: timestamp || new Date(),
            safetyClassification
        });
        await record.save();
        // Log Activity
        const activity = new Activity_1.Activity({
            childId: device.childId,
            deviceId,
            type: 'SMS',
            title: `${type === 'INCOMING' ? 'Incoming' : 'Outgoing'} SMS`,
            description: `SMS ${type === 'INCOMING' ? 'received' : 'sent'}`,
            metadata: { type, safetyCategory: safetyClassification.category }
        });
        await activity.save();
        (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('sms:new', record);
        (0, socketHandler_1.getIo)().to(`parent_${child.parentId}`).emit('activity:new', activity);
        res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error('Error syncing SMS:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.syncSms = syncSms;
const getCalls = async (req, res) => {
    try {
        const { childId, deviceId, type, days } = req.query;
        // verify parent ownership
        if (childId) {
            const child = await Child_1.Child.findById(childId);
            if (!child || child.parentId.toString() !== req.user?.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }
        else {
            const children = await Child_1.Child.find({ parentId: req.user?.id });
            const childIds = children.map(c => c._id);
            req.query.childId = { $in: childIds };
        }
        const filter = {};
        if (req.query.childId)
            filter.childId = req.query.childId;
        if (deviceId)
            filter.deviceId = deviceId;
        if (type && type !== 'All')
            filter.type = type;
        if (days) {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            filter.timestamp = { $gte: date };
        }
        const calls = await CallRecord_1.CallRecord.find(filter)
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('childId', 'name')
            .populate('deviceId', 'deviceName');
        res.status(200).json({ success: true, data: calls });
    }
    catch (error) {
        console.error('Error getting calls:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getCalls = getCalls;
const getSms = async (req, res) => {
    try {
        const { childId, deviceId, type, safetyStatus, days } = req.query;
        if (childId) {
            const child = await Child_1.Child.findById(childId);
            if (!child || child.parentId.toString() !== req.user?.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }
        else {
            const children = await Child_1.Child.find({ parentId: req.user?.id });
            const childIds = children.map(c => c._id);
            req.query.childId = { $in: childIds };
        }
        const filter = {};
        if (req.query.childId)
            filter.childId = req.query.childId;
        if (deviceId)
            filter.deviceId = deviceId;
        if (type && type !== 'All')
            filter.type = type;
        if (safetyStatus && safetyStatus !== 'All') {
            if (safetyStatus === 'Flagged') {
                filter['safetyClassification.severity'] = { $in: ['MEDIUM', 'HIGH'] };
            }
            else {
                filter['safetyClassification.category'] = safetyStatus;
            }
        }
        if (days) {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            filter.timestamp = { $gte: date };
        }
        const sms = await SmsRecord_1.SmsRecord.find(filter)
            .sort({ timestamp: -1 })
            .limit(100)
            .populate('childId', 'name')
            .populate('deviceId', 'deviceName');
        res.status(200).json({ success: true, data: sms });
    }
    catch (error) {
        console.error('Error getting SMS:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getSms = getSms;
