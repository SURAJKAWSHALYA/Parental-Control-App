import { Response } from 'express';
import { AppLimit } from '../models/AppLimit';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler'; // We will need to export io or a helper

// Get all limits for a device
export const getAppLimits = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const limits = await AppLimit.find({ deviceId });
    sendSuccess(res, limits, 'App limits fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Create or update limit (Upsert-like via POST for simplicity, or strictly POST)
export const setAppLimit = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, packageName, appName, dailyLimitMinutes, enabled } = req.body;

    if (!deviceId || !packageName || dailyLimitMinutes === undefined) {
      return sendError(res, 'Missing required fields', 'VALIDATION_ERROR', 400);
    }

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const limit = await AppLimit.findOneAndUpdate(
      { deviceId, packageName },
      {
        childId: device.childId,
        appName: appName || packageName,
        dailyLimitMinutes,
        enabled: enabled !== undefined ? enabled : true,
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Emit Socket.IO event to device
    const io = getIo();
    if (io) {
      io.to(`device_${deviceId}`).emit('app:limit:set', limit);
    }

    sendSuccess(res, limit, 'App limit set successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Update an existing limit by ID
export const updateAppLimit = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;
    const { dailyLimitMinutes, enabled } = req.body;

    const limit = await AppLimit.findById(id);
    if (!limit) return sendError(res, 'Limit not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: limit.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Access denied', 'FORBIDDEN', 403);

    if (dailyLimitMinutes !== undefined) limit.dailyLimitMinutes = dailyLimitMinutes;
    if (enabled !== undefined) limit.enabled = enabled;
    
    await limit.save();

    // Emit Socket.IO event to device
    const io = getIo();
    if (io) {
      io.to(`device_${limit.deviceId}`).emit('app:limit:set', limit);
    }

    sendSuccess(res, limit, 'App limit updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Delete a limit
export const deleteAppLimit = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;

    const limit = await AppLimit.findById(id);
    if (!limit) return sendError(res, 'Limit not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: limit.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Access denied', 'FORBIDDEN', 403);

    await AppLimit.findByIdAndDelete(id);

    // Emit Socket.IO event to device
    const io = getIo();
    if (io) {
      io.to(`device_${limit.deviceId}`).emit('app:limit:remove', { packageName: limit.packageName });
    }

    sendSuccess(res, {}, 'App limit removed successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
