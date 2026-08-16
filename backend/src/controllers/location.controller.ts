import { Response } from 'express';
import { LocationRecord } from '../models/LocationRecord';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { Activity } from '../models/Activity';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler';

const verifyDeviceOwnership = async (parentId: string, deviceId: string) => {
  const children = await Child.find({ parentId }).select('_id');
  const childIds = children.map(c => c._id);
  const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });
  return device;
};

// POST /api/location/sync (Device pushes offline batch)
export const syncLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, records } = req.body;
    // For sync, req.user could be the device itself (if using device token)
    // Assuming we use standard parent/device auth logic:
    let device;
    if (req.user.role === 'device') {
      if (req.user._id.toString() !== deviceId) return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
      device = await Device.findById(deviceId);
    } else {
      device = await verifyDeviceOwnership(req.user._id, deviceId);
    }

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);
    if (!records || !Array.isArray(records)) return sendError(res, 'Invalid records format', 'VALIDATION_ERROR', 400);

    const validRecords = records.map((r: any) => ({
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
      // Idempotency: filter out records with timestamps that already exist for this device
      const timestamps = validRecords.map((r: any) => r.timestamp);
      const existingRecords = await LocationRecord.find({
        deviceId: device._id,
        timestamp: { $in: timestamps }
      }).select('timestamp');
      
      const existingTimestamps = new Set(existingRecords.map(r => r.timestamp.getTime()));
      const newRecords = validRecords.filter((r: any) => !existingTimestamps.has(r.timestamp.getTime()));

      if (newRecords.length > 0) {
        await LocationRecord.insertMany(newRecords);
      }
      
      // Emit the latest one to parent if needed
      const latest = validRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      const io = getIo();
      if (io) {
        const child = await Child.findById(device.childId);
        if (child) {
          io.to(`parent_${child.parentId}`).emit('location:updated', { deviceId: device._id, location: latest });
        }
      }
    }

    sendSuccess(res, { syncedCount: validRecords.length }, 'Locations synced successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/location/:deviceId/current
export const getCurrentLocation = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const latestLocation = await LocationRecord.findOne({ deviceId }).sort({ timestamp: -1 });
    sendSuccess(res, latestLocation, 'Current location fetched');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/location/:deviceId/history
export const getLocationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { startDate, endDate, page = 1, limit = 100 } = req.query;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const maxLimit = 500; // prevent unlimited queries
    const parsedLimit = Math.min(parseInt(limit as string) || 100, maxLimit);
    const parsedPage = Math.max(parseInt(page as string) || 1, 1);
    
    const query: any = { deviceId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const total = await LocationRecord.countDocuments(query);
    const history = await LocationRecord.find(query)
      .sort({ timestamp: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    sendSuccess(res, {
      data: history,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    }, 'Location history fetched');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// DELETE /api/location/:deviceId/history
export const deleteLocationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { startDate, endDate } = req.body; // Expect date ranges to delete

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const query: any = { deviceId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const result = await LocationRecord.deleteMany(query);

    sendSuccess(res, { deletedCount: result.deletedCount }, 'Location history deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
