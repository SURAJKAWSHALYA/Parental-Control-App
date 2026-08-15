import { Response } from 'express';
import { Geofence } from '../models/Geofence';
import { Place } from '../models/Place';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';
import { Activity } from '../models/Activity';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler';

const verifyDeviceOwnership = async (parentId: string, deviceId: string) => {
  const children = await Child.find({ parentId }).select('_id');
  const childIds = children.map(c => c._id);
  return await Device.findOne({ _id: deviceId, childId: { $in: childIds } });
};

export const getGeofences = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const geofences = await Geofence.find({ deviceId });
    sendSuccess(res, geofences, 'Geofences fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createGeofence = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { placeId, enabled, enterAlert, exitAlert } = req.body;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const place = await Place.findOne({ _id: placeId, parentId });
    if (!place) return sendError(res, 'Place not found or access denied', 'NOT_FOUND', 404);

    // Ensure we don't duplicate
    let geofence = await Geofence.findOne({ deviceId, placeId });
    if (geofence) {
      return sendError(res, 'Geofence already exists for this place and device', 'CONFLICT', 409);
    }

    geofence = await Geofence.create({
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

    const io = getIo();
    if (io) {
      io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
    }

    sendSuccess(res, geofence, 'Geofence created successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateGeofence = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, id } = req.params;
    const { enabled, enterAlert, exitAlert } = req.body;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const geofence = await Geofence.findOne({ _id: id, deviceId });
    if (!geofence) return sendError(res, 'Geofence not found', 'NOT_FOUND', 404);

    geofence.enabled = enabled ?? geofence.enabled;
    geofence.enterAlert = enterAlert ?? geofence.enterAlert;
    geofence.exitAlert = exitAlert ?? geofence.exitAlert;

    await geofence.save();

    const io = getIo();
    if (io) {
      io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
    }

    sendSuccess(res, geofence, 'Geofence updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteGeofence = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, id } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const geofence = await Geofence.findOneAndDelete({ _id: id, deviceId });

    if (geofence) {
      const io = getIo();
      if (io) {
        io.to(`parent_${parentId}`).emit('geofence:update', { deviceId });
      }
    }

    sendSuccess(res, null, 'Geofence deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Device pushes an event here (ENTER/EXIT)
export const handleGeofenceEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, placeId, eventType, timestamp } = req.body;
    
    // We expect the device to be authenticated
    let device;
    if (req.user.role === 'device') {
      if (req.user._id.toString() !== deviceId) return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
      device = await Device.findById(deviceId);
    } else {
      device = await verifyDeviceOwnership(req.user._id, deviceId);
    }

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const child = await Child.findById(device.childId);
    if (!child) return sendError(res, 'Child not found', 'NOT_FOUND', 404);

    const geofence = await Geofence.findOne({ deviceId, placeId });
    if (!geofence || !geofence.enabled) {
      return sendSuccess(res, null, 'Geofence inactive or disabled, ignored');
    }

    const eventTime = timestamp ? new Date(timestamp) : new Date();

    // Create Activity
    await Activity.create({
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
      const alert = await Alert.create({
        parentId: child.parentId,
        childId: child._id,
        deviceId: device._id,
        type: eventType === 'ENTER' ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT',
        title: eventType === 'ENTER' ? `Arrived at ${geofence.name}` : `Left ${geofence.name}`,
        message: eventType === 'ENTER' ? `${child.name} arrived at ${geofence.name}` : `${child.name} left ${geofence.name}`,
        severity: 'LOW',
        createdAt: eventTime
      });

      const io = getIo();
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

    sendSuccess(res, { alertCreated }, 'Geofence event processed');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
