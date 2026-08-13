"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDowntimeSchedule = exports.updateDowntimeSchedule = exports.createDowntimeSchedule = exports.getDowntimeSchedules = void 0;
const DowntimeSchedule_1 = require("../models/DowntimeSchedule");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler");
const getDowntimeSchedules = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const schedules = await DowntimeSchedule_1.DowntimeSchedule.find({ deviceId });
        (0, response_1.sendSuccess)(res, schedules, 'Schedules fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getDowntimeSchedules = getDowntimeSchedules;
const createDowntimeSchedule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, name, days, startTime, endTime, enabled } = req.body;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const schedule = await DowntimeSchedule_1.DowntimeSchedule.create({
            childId: device.childId,
            deviceId,
            name,
            days,
            startTime,
            endTime,
            enabled: enabled !== undefined ? enabled : true,
        });
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('downtime:create', schedule);
        (0, response_1.sendSuccess)(res, schedule, 'Schedule created', 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createDowntimeSchedule = createDowntimeSchedule;
const updateDowntimeSchedule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const schedule = await DowntimeSchedule_1.DowntimeSchedule.findById(id);
        if (!schedule)
            return (0, response_1.sendError)(res, 'Schedule not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: schedule.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Unauthorized', 'FORBIDDEN', 403);
        Object.assign(schedule, req.body);
        await schedule.save();
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${schedule.deviceId}`).emit('downtime:update', schedule);
        (0, response_1.sendSuccess)(res, schedule, 'Schedule updated');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateDowntimeSchedule = updateDowntimeSchedule;
const deleteDowntimeSchedule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const schedule = await DowntimeSchedule_1.DowntimeSchedule.findById(id);
        if (!schedule)
            return (0, response_1.sendError)(res, 'Schedule not found', 'NOT_FOUND', 404);
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: schedule.deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Unauthorized', 'FORBIDDEN', 403);
        await DowntimeSchedule_1.DowntimeSchedule.findByIdAndDelete(id);
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${schedule.deviceId}`).emit('downtime:delete', { id });
        (0, response_1.sendSuccess)(res, {}, 'Schedule deleted');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteDowntimeSchedule = deleteDowntimeSchedule;
