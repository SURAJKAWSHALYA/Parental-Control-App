"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGeofenceEvent = exports.deleteGeofence = exports.updateGeofence = exports.createGeofence = exports.getGeofences = void 0;
const Geofence_1 = require("../models/Geofence");
const Place_1 = require("../models/Place");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const Alert_1 = require("../models/Alert");
const Activity_1 = require("../models/Activity");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler");
const verifyDeviceOwnership = async (parentId, deviceId) => {
    const children = await Child_1.Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    return await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
};
const getGeofences = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const geofences = await Geofence_1.Geofence.find({ deviceId });
        (0, response_1.sendSuccess)(res, geofences, 'Geofences fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getGeofences = getGeofences;
const createGeofence = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { placeId, enabled, enterAlert, exitAlert } = req.body;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const place = await Place_1.Place.findOne({ _id: placeId, parentId });
        if (!place)
            return (0, response_1.sendError)(res, 'Place not found or access denied', 'NOT_FOUND', 404);
        // Ensure we don't duplicate
        let geofence = await Geofence_1.Geofence.findOne({ deviceId, placeId });
        if (geofence) {
            return (0, response_1.sendError)(res, 'Geofence already exists for this place and device', 'CONFLICT', 409);
        }
        geofence = await Geofence_1.Geofence.create({
            childId: device.childId,
            deviceId,
            placeId,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            radiusMeters: place.radiusMeters,
            enabled: enabled ?? true,
            enterAlert: enterAlert ?? true,
            exitAlert: exitAlert ?? true,
        });
        const io = (0, socketHandler_1.getIo)();
        if (io) {
            io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
        }
        (0, response_1.sendSuccess)(res, geofence, 'Geofence created successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createGeofence = createGeofence;
const updateGeofence = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, id } = req.params;
        const { enabled, enterAlert, exitAlert } = req.body;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const geofence = await Geofence_1.Geofence.findOne({ _id: id, deviceId });
        if (!geofence)
            return (0, response_1.sendError)(res, 'Geofence not found', 'NOT_FOUND', 404);
        geofence.enabled = enabled ?? geofence.enabled;
        geofence.enterAlert = enterAlert ?? geofence.enterAlert;
        geofence.exitAlert = exitAlert ?? geofence.exitAlert;
        await geofence.save();
        const io = (0, socketHandler_1.getIo)();
        if (io) {
            io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
        }
        (0, response_1.sendSuccess)(res, geofence, 'Geofence updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateGeofence = updateGeofence;
const deleteGeofence = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, id } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const geofence = await Geofence_1.Geofence.findOneAndDelete({ _id: id, deviceId });
        if (geofence) {
            const io = (0, socketHandler_1.getIo)();
            if (io) {
                io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
            }
        }
        (0, response_1.sendSuccess)(res, null, 'Geofence deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteGeofence = deleteGeofence;
// Device pushes an event here (ENTER/EXIT)
const handleGeofenceEvent = async (req, res) => {
    try {
        const { deviceId, placeId, eventType, timestamp } = req.body;
        // We expect the device to be authenticated
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
        const child = await Child_1.Child.findById(device.childId);
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found', 'NOT_FOUND', 404);
        const geofence = await Geofence_1.Geofence.findOne({ deviceId, placeId });
        if (!geofence || !geofence.enabled) {
            return (0, response_1.sendSuccess)(res, null, 'Geofence inactive or disabled, ignored');
        }
        const eventTime = timestamp ? new Date(timestamp) : new Date();
        // Create Activity
        await Activity_1.Activity.create({
            childId: child._id,
            deviceId: device._id,
            type: 'GEOFENCE',
            title: eventType === 'ENTER' ? `Entered ${geofence.name}` : `Left ${geofence.name}`,
            description: eventType === 'ENTER' ? `Arrived at ${geofence.name}` : `Departed from ${geofence.name}`,
            metadata: { placeId, eventType },
            timestamp: eventTime
        });
        // Create Alert if requested
        let alertCreated = false;
        if ((eventType === 'ENTER' && geofence.enterAlert) || (eventType === 'EXIT' && geofence.exitAlert)) {
            const alert = await Alert_1.Alert.create({
                parentId: child.parentId,
                childId: child._id,
                deviceId: device._id,
                type: eventType === 'ENTER' ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT',
                title: eventType === 'ENTER' ? `Arrived at ${geofence.name}` : `Left ${geofence.name}`,
                message: eventType === 'ENTER' ? `${child.name} arrived at ${geofence.name}` : `${child.name} left ${geofence.name}`,
                severity: 'LOW',
                createdAt: eventTime
            });
            const io = (0, socketHandler_1.getIo)();
            if (io) {
                io.to(`parent_${child.parentId}`).emit('alert:new', alert);
                io.to(`parent_${child.parentId}`).emit(eventType === 'ENTER' ? 'geofence:entered' : 'geofence:exited', {
                    childId: child._id,
                    deviceId: device._id,
                    placeName: geofence.name,
                    timestamp: eventTime
                });
            }
            alertCreated = true;
        }
        (0, response_1.sendSuccess)(res, { alertCreated }, 'Geofence event processed');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.handleGeofenceEvent = handleGeofenceEvent;
