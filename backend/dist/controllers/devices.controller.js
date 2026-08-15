"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceStatus = exports.heartbeat = exports.deleteDevice = exports.getDevice = exports.getDevices = void 0;
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const getDevices = async (req, res) => {
    try {
        // First, find all children belonging to this parent
        const children = await Child_1.Child.find({ parentId: req.user._id }).select('_id');
        const childIds = children.map(c => c._id);
        // Find all devices associated with those children
        const devices = await Device_1.Device.find({ childId: { $in: childIds } });
        (0, response_1.sendSuccess)(res, devices, 'Devices fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getDevices = getDevices;
const getDevice = async (req, res) => {
    try {
        const children = await Child_1.Child.find({ parentId: req.user._id }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: req.params.id, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, device, 'Device fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getDevice = getDevice;
const deleteDevice = async (req, res) => {
    try {
        const children = await Child_1.Child.find({ parentId: req.user._id }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOneAndDelete({ _id: req.params.id, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        // Invalidate device credentials / Disconnect Socket.IO
        const { getIo } = require('../sockets/socketHandler');
        const io = getIo();
        io.to(`device_${device.childId}`).disconnectSockets(true);
        (0, response_1.sendSuccess)(res, {}, 'Device deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteDevice = deleteDevice;
const heartbeat = async (req, res) => {
    try {
        const { batteryLevel, appVersion } = req.body;
        const deviceId = req.user.deviceId; // from protectDevice
        const device = await Device_1.Device.findByIdAndUpdate(deviceId, {
            lastSeen: new Date(),
            isOnline: true,
            batteryLevel: batteryLevel !== undefined ? batteryLevel : undefined,
            appVersion: appVersion !== undefined ? appVersion : undefined,
        }, { new: true, runValidators: true });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, { success: true }, 'Heartbeat recorded');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.heartbeat = heartbeat;
const getDeviceStatus = async (req, res) => {
    try {
        const children = await Child_1.Child.find({ parentId: req.user._id }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: req.params.id, childId: { $in: childIds } }).select('isOnline batteryLevel lastSeen androidVersion appVersion');
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, device, 'Device status fetched');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getDeviceStatus = getDeviceStatus;
