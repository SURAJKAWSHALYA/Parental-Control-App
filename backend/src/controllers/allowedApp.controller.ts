import { Response } from 'express';
import { AllowedApp } from '../models/AllowedApp';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler';

export const getAllowedApps = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const apps = await AllowedApp.find({ deviceId });
    sendSuccess(res, apps, 'Allowed apps fetched');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createAllowedApp = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, packageName, appName, allowedDuringDowntime } = req.body;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const app = await AllowedApp.findOneAndUpdate(
      { deviceId, packageName },
      {
        childId: device.childId,
        appName,
        allowedDuringDowntime: allowedDuringDowntime !== undefined ? allowedDuringDowntime : true
      },
      { new: true, upsert: true, runValidators: true }
    );

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP', data: app });

    sendSuccess(res, app, 'Allowed app saved', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateAllowedApp = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;
    const { allowedDuringDowntime } = req.body;

    const app = await AllowedApp.findById(id);
    if (!app) return sendError(res, 'App not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: app.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Unauthorized', 'FORBIDDEN', 403);

    app.allowedDuringDowntime = allowedDuringDowntime;
    await app.save();

    const io = getIo();
    if (io) io.to(`device_${app.deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP', data: app });

    sendSuccess(res, app, 'Allowed app updated');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteAllowedApp = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;

    const app = await AllowedApp.findById(id);
    if (!app) return sendError(res, 'App not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: app.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Unauthorized', 'FORBIDDEN', 403);

    await AllowedApp.findByIdAndDelete(id);

    const io = getIo();
    if (io) io.to(`device_${app.deviceId}`).emit('restriction:updated', { type: 'ALLOWED_APP_REMOVED', data: { packageName: app.packageName } });

    sendSuccess(res, {}, 'Allowed app removed');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
