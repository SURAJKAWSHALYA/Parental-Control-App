import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Parent } from '../models/Parent';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      req.user = await Parent.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return sendError(res, 'Not authorized, user not found', 'UNAUTHORIZED', 401);
      }
      next();
    } catch (error) {
      return sendError(res, 'Not authorized, token failed', 'UNAUTHORIZED', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token', 'UNAUTHORIZED', 401);
  }
};

export const protectDevice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      if (decoded.role !== 'device') {
         return sendError(res, 'Invalid token role', 'UNAUTHORIZED', 401);
      }
      req.user = { deviceId: decoded.id, childId: decoded.childId }; // Using req.user as a generic authenticated entity
      next();
    } catch (error) {
      return sendError(res, 'Not authorized, device token failed', 'UNAUTHORIZED', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no device token', 'UNAUTHORIZED', 401);
  }
};
