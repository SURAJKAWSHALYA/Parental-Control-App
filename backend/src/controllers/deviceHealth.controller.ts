import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { DeviceHealth } from '../models/DeviceHealth';
import { Child } from '../models/Child';

export const getDeviceHealth = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId } = req.params;
    const parentId = req.user.familyId;

    // Verify ownership
    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    
    // We import Device just to check ownership, but instead we could just verify if DeviceHealth exists
    // and if the related device belongs to this parent. A quick way is to check Device.
    const { Device } = await import('../models/Device');
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) {
      return sendError(res, 'Device not found or unauthorized', 'NOT_FOUND', 404);
    }

    const health = await DeviceHealth.findOne({ deviceId });
    if (!health) {
      return sendError(res, 'No health data available for this device', 'NOT_FOUND', 404);
    }

    sendSuccess(res, health, 'Device health retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
