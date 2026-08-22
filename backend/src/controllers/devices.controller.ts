import { Response } from 'express';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDevices = async (req: AuthRequest, res: Response) => {
  try {
    // First, find all children belonging to this parent
    const children = await Child.find({ parentId: req.user._id }).select('_id');
    const childIds = children.map(c => c._id);

    // Find all devices associated with those children
    const devices = await Device.find({ childId: { $in: childIds } }).populate('childId', 'name');
    sendSuccess(res, devices, 'Devices fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getDevice = async (req: AuthRequest, res: Response) => {
  try {
    const children = await Child.find({ parentId: req.user._id }).select('_id');
    const childIds = children.map(c => c._id);

    const device = await Device.findOne({ _id: req.params.id, childId: { $in: childIds } });
    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);
    
    sendSuccess(res, device, 'Device fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response) => {
  try {
    const children = await Child.find({ parentId: req.user._id }).select('_id');
    const childIds = children.map(c => c._id);

    const device = await Device.findOneAndDelete({ _id: req.params.id, childId: { $in: childIds } });
    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    // Invalidate device credentials / Disconnect Socket.IO
    const { getIo } = require('../sockets/socketHandler');
    const io = getIo();
    io.to(`device_${device.childId}`).disconnectSockets(true);

    sendSuccess(res, {}, 'Device deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const heartbeat = async (req: AuthRequest, res: Response) => {
  try {
    const { batteryLevel, appVersion } = req.body;
    const deviceId = req.user.deviceId; // from protectDevice

    const device = await Device.findByIdAndUpdate(
      deviceId,
      {
        lastSeen: new Date(),
        isOnline: true,
        batteryLevel: batteryLevel !== undefined ? batteryLevel : undefined,
        appVersion: appVersion !== undefined ? appVersion : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);
    
    sendSuccess(res, { success: true }, 'Heartbeat recorded');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getDeviceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const children = await Child.find({ parentId: req.user._id }).select('_id');
    const childIds = children.map(c => c._id);

    const device = await Device.findOne({ _id: req.params.id, childId: { $in: childIds } }).select('isOnline batteryLevel lastSeen androidVersion appVersion');
    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);
    
    sendSuccess(res, device, 'Device status fetched');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
