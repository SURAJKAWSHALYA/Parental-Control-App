import { Response } from 'express';
import { Alert } from '../models/Alert';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    
    const parsedLimit = Math.min(Number(limit) || 50, 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    
    const alerts = await Alert.find({ parentId })
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);
      
    const total = await Alert.countDocuments({ parentId });
    
    sendSuccess(res, {
      data: alerts,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    }, 'Alerts fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getAlert = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const alert = await Alert.findOne({ _id: req.params.id, parentId });
    if (!alert) return sendError(res, 'Alert not found', 'NOT_FOUND', 404);
    sendSuccess(res, alert, 'Alert fetched');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, parentId },
      { isRead: true },
      { new: true }
    );
    if (!alert) return sendError(res, 'Alert not found', 'NOT_FOUND', 404);
    sendSuccess(res, alert, 'Alert marked as read');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    await Alert.updateMany({ parentId, isRead: false }, { isRead: true });
    sendSuccess(res, {}, 'All alerts marked as read');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
