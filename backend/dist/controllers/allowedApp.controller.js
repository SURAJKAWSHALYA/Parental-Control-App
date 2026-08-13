"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllowedApp = exports.updateAllowedApp = exports.createAllowedApp = exports.getAllowedApps = void 0;
const AllowedApp_1 = require("../models/AllowedApp");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler");
const getAllowedApps = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const apps = await AllowedApp_1.AllowedApp.find({ deviceId });
        (0, response_1.sendSuccess)(res, apps, 'Allowed apps fetched');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getAllowedApps = getAllowedApps;
const createAllowedApp = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, packageName, appName, allowedDuringDowntime } = req.body;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const app = await AllowedApp_1.AllowedApp.findOneAndUpdate({ deviceId, packageName }, {
            childId: device.childId,
            appName,
            allowedDuringDowntime: allowedDuringDowntime !== undefined ? allowedDuringDowntime : true
        }, { new: true, upsert: true, runValidators: true });
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP', data: app });
        (0, response_1.sendSuccess)(res, app, 'Allowed app saved', 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createAllowedApp = createAllowedApp;
const updateAllowedApp = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const { allowedDuringDowntime } = req.body;
        const app = await AllowedApp_1.AllowedApp.findById(id);
        if (!app)
            return (0, response_1.sendError)(res, 'App not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: app.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Unauthorized', 'FORBIDDEN', 403);
        app.allowedDuringDowntime = allowedDuringDowntime;
        await app.save();
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${app.deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP', data: app });
        (0, response_1.sendSuccess)(res, app, 'Allowed app updated');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateAllowedApp = updateAllowedApp;
const deleteAllowedApp = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const app = await AllowedApp_1.AllowedApp.findById(id);
        if (!app)
            return (0, response_1.sendError)(res, 'App not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: app.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Unauthorized', 'FORBIDDEN', 403);
        await AllowedApp_1.AllowedApp.findByIdAndDelete(id);
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${app.deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP_REMOVED', data: { packageName: app.packageName } });
        (0, response_1.sendSuccess)(res, {}, 'Allowed app removed');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteAllowedApp = deleteAllowedApp;
