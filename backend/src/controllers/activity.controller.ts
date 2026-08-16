import { Response } from 'express';
import { Activity } from '../models/Activity';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getActivity = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { page = 1, limit = 50, type } = req.query;
    const parsedLimit = Math.min(Number(limit) || 50, 100);
    const parsedPage = Math.max(Number(page) || 1, 1);

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const query: any = { deviceId };
    if (type) query.type = type;

    const activities = await Activity.find(query)
      .sort({ serverTimestamp: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    sendSuccess(res, activities, 'Activity fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
