"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppLimit = exports.updateAppLimit = exports.setAppLimit = exports.getAppLimits = void 0;
const AppLimit_1 = require("../models/AppLimit");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler"); // We will need to export io or a helper
// Get all limits for a device
const getAppLimits = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const limits = await AppLimit_1.AppLimit.find({ deviceId });
        (0, response_1.sendSuccess)(res, limits, 'App limits fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getAppLimits = getAppLimits;
// Create or update limit (Upsert-like via POST for simplicity, or strictly POST)
const setAppLimit = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, packageName, appName, dailyLimitMinutes, enabled } = req.body;
        if (!deviceId || !packageName || dailyLimitMinutes === undefined) {
            return (0, response_1.sendError)(res, 'Missing required fields', 'VALIDATION_ERROR', 400);
        }
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const limit = await AppLimit_1.AppLimit.findOneAndUpdate({ deviceId, packageName }, {
            childId: device.childId,
            appName: appName || packageName,
            dailyLimitMinutes,
            enabled: enabled !== undefined ? enabled : true,
        }, { new: true, upsert: true, runValidators: true });
        // Emit Socket.IO event to device
        const io = (0, socketHandler_1.getIo)();
        if (io) {
            io.to(`device_${deviceId}`).emit('app:limit:set', limit);
        }
        (0, response_1.sendSuccess)(res, limit, 'App limit set successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.setAppLimit = setAppLimit;
// Update an existing limit by ID
const updateAppLimit = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const { dailyLimitMinutes, enabled } = req.body;
        const limit = await AppLimit_1.AppLimit.findById(id);
        if (!limit)
            return (0, response_1.sendError)(res, 'Limit not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: limit.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Access denied', 'FORBIDDEN', 403);
        if (dailyLimitMinutes !== undefined)
            limit.dailyLimitMinutes = dailyLimitMinutes;
        if (enabled !== undefined)
            limit.enabled = enabled;
        await limit.save();
        // Emit Socket.IO event to device
        const io = (0, socketHandler_1.getIo)();
        if (io) {
            io.to(`device_${limit.deviceId}`).emit('app:limit:set', limit);
        }
        (0, response_1.sendSuccess)(res, limit, 'App limit updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateAppLimit = updateAppLimit;
// Delete a limit
const deleteAppLimit = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const limit = await AppLimit_1.AppLimit.findById(id);
        if (!limit)
            return (0, response_1.sendError)(res, 'Limit not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: limit.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Access denied', 'FORBIDDEN', 403);
        await AppLimit_1.AppLimit.findByIdAndDelete(id);
        // Emit Socket.IO event to device
        const io = (0, socketHandler_1.getIo)();
        if (io) {
            io.to(`device_${limit.deviceId}`).emit('app:limit:remove', { packageName: limit.packageName });
        }
        (0, response_1.sendSuccess)(res, {}, 'App limit removed successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteAppLimit = deleteAppLimit;
