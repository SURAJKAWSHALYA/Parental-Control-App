import { Response } from 'express';
import { AppUsage } from '../models/AppUsage';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const syncUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, childId } = req.user;
    const { usageData } = req.body;

    if (!Array.isArray(usageData)) {
      return sendError(res, 'Invalid usage data format', 'BAD_REQUEST', 400);
    }

    const bulkOps = usageData.map((usage: any) => {
      // Normalize usageDate to start of day
      const date = new Date(usage.usageDate);
      date.setUTCHours(0, 0, 0, 0);

      return {
        updateOne: {
          filter: {
            deviceId,
            packageName: usage.packageName,
            usageDate: date,
          },
          update: {
            $set: {
              childId,
              appName: usage.appName,
              usageDuration: usage.usageDuration,
              launchCount: usage.launchCount,
              firstUsedAt: usage.firstUsedAt,
              lastUsedAt: usage.lastUsedAt,
            }
          },
          upsert: true,
        }
      };
    });

    if (bulkOps.length > 0) {
      await AppUsage.bulkWrite(bulkOps);
    }

    sendSuccess(res, { success: true }, 'Usage data synced successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getTodayUsage = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    // Verify parent owns this device via child
    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) {
      return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const usage = await AppUsage.find({
      deviceId,
      usageDate: today
    }).sort({ usageDuration: -1 });

    sendSuccess(res, usage, 'Today\'s usage fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getUsageHistory = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { days = 7 } = req.query;

    const children = await Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });

    if (!device) {
      return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);
    }

    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (Number(days) - 1));

    const usage = await AppUsage.find({
      deviceId,
      usageDate: { $gte: startDate }
    }).sort({ usageDate: 1, usageDuration: -1 });

    sendSuccess(res, usage, 'Usage history fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
