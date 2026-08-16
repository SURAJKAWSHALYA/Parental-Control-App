import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';
import bcrypt from 'bcrypt';
import { Parent } from '../models/Parent';

export const requireRecentAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return sendError(res, 'Password required for sensitive action', 'RE_AUTH_REQUIRED', 403);
    }

    const parent = await Parent.findById(req.user._id).select('+password');
    if (!parent) {
      return sendError(res, 'User not found', 'NOT_FOUND', 404);
    }

    const isMatch = await bcrypt.compare(password, parent.password);
    if (!isMatch) {
      return sendError(res, 'Incorrect password', 'INVALID_CREDENTIALS', 401);
    }

    next();
  } catch (error: any) {
    console.error('Re-auth error:', error);
    sendError(res, 'Failed to verify authentication', 'SERVER_ERROR', 500);
  }
};
