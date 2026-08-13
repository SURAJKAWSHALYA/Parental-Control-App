import { Response } from 'express';
import { DowntimeSchedule } from '../models/DowntimeSchedule';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler';

export const getDowntimeSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const schedules = await DowntimeSchedule.find({ deviceId });
    sendSuccess(res, schedules, 'Schedules fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createDowntimeSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, name, days, startTime, endTime, enabled } = req.body;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const schedule = await DowntimeSchedule.create({
      childId: device.childId,
      deviceId,
      name,
      days,
      startTime,
      endTime,
      enabled: enabled !== undefined ? enabled : true,
    });

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('downtime:create', schedule);

    sendSuccess(res, schedule, 'Schedule created', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateDowntimeSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;

    const schedule = await DowntimeSchedule.findById(id);
    if (!schedule) return sendError(res, 'Schedule not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: schedule.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Unauthorized', 'FORBIDDEN', 403);

    Object.assign(schedule, req.body);
    await schedule.save();

    const io = getIo();
    if (io) io.to(`device_${schedule.deviceId}`).emit('downtime:update', schedule);

    sendSuccess(res, schedule, 'Schedule updated');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteDowntimeSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;

    const schedule = await DowntimeSchedule.findById(id);
    if (!schedule) return sendError(res, 'Schedule not found', 'NOT_FOUND', 404);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: schedule.deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Unauthorized', 'FORBIDDEN', 403);

    await DowntimeSchedule.findByIdAndDelete(id);

    const io = getIo();
    if (io) io.to(`device_${schedule.deviceId}`).emit('downtime:delete', { id });

    sendSuccess(res, {}, 'Schedule deleted');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
