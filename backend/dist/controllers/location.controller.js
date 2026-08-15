"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocationHistory = exports.getLocationHistory = exports.getCurrentLocation = exports.syncLocation = void 0;
const LocationRecord_1 = require("../models/LocationRecord");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler");
const verifyDeviceOwnership = async (parentId, deviceId) => {
    const children = await Child_1.Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
    return device;
};
// POST /api/location/sync (Device pushes offline batch)
const syncLocation = async (req, res) => {
    try {
        const { deviceId, records } = req.body;
        // For sync, req.user could be the device itself (if using device token)
        // Assuming we use standard parent/device auth logic:
        let device;
        if (req.user.role === 'device') {
            if (req.user._id.toString() !== deviceId)
                return (0, response_1.sendError)(res, 'Unauthorized', 'UNAUTHORIZED', 401);
            device = await Device_1.Device.findById(deviceId);
        }
        else {
            device = await verifyDeviceOwnership(req.user._id, deviceId);
        }
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        if (!records || !Array.isArray(records))
            return (0, response_1.sendError)(res, 'Invalid records format', 'VALIDATION_ERROR', 400);
        const validRecords = records.map((r) => ({
            childId: device.childId,
            deviceId: device._id,
            latitude: r.latitude,
            longitude: r.longitude,
            accuracy: r.accuracy,
            altitude: r.altitude,
            speed: r.speed,
            heading: r.heading,
            battery: r.battery,
            source: r.source || 'fused',
            timestamp: new Date(r.timestamp)
        })).filter(r => r.latitude >= -90 && r.latitude <= 90 && r.longitude >= -180 && r.longitude <= 180);
        if (validRecords.length > 0) {
            await LocationRecord_1.LocationRecord.insertMany(validRecords);
            // Emit the latest one to parent if needed
            const latest = validRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
            const io = (0, socketHandler_1.getIo)();
            if (io) {
                const child = await Child_1.Child.findById(device.childId);
                if (child) {
                    io.to(`parent_${child.parentId}`).emit('location:updated', { deviceId: device._id, location: latest });
                }
            }
        }
        (0, response_1.sendSuccess)(res, { syncedCount: validRecords.length }, 'Locations synced successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.syncLocation = syncLocation;
// GET /api/location/:deviceId/current
const getCurrentLocation = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const latestLocation = await LocationRecord_1.LocationRecord.findOne({ deviceId }).sort({ timestamp: -1 });
        (0, response_1.sendSuccess)(res, latestLocation, 'Current location fetched');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getCurrentLocation = getCurrentLocation;
// GET /api/location/:deviceId/history
const getLocationHistory = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { startDate, endDate, page = 1, limit = 100 } = req.query;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const maxLimit = 500; // prevent unlimited queries
        const parsedLimit = Math.min(parseInt(limit) || 100, maxLimit);
        const parsedPage = Math.max(parseInt(page) || 1, 1);
        const query = { deviceId };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const total = await LocationRecord_1.LocationRecord.countDocuments(query);
        const history = await LocationRecord_1.LocationRecord.find(query)
            .sort({ timestamp: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);
        (0, response_1.sendSuccess)(res, {
            data: history,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        }, 'Location history fetched');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getLocationHistory = getLocationHistory;
// DELETE /api/location/:deviceId/history
const deleteLocationHistory = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { startDate, endDate } = req.body; // Expect date ranges to delete
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const query = { deviceId };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const result = await LocationRecord_1.LocationRecord.deleteMany(query);
        (0, response_1.sendSuccess)(res, { deletedCount: result.deletedCount }, 'Location history deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteLocationHistory = deleteLocationHistory;
