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

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) return sendError(res, 'Device not found', 'NOT_FOUND', 404);

    const query: any = { deviceId };
    if (type) query.type = type;

    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    sendSuccess(res, activities, 'Activity fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
