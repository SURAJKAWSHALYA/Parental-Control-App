import { Request, Response } from 'express';
import { Parent } from '../models/Parent';
import { hashPassword, matchPassword, generateToken } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  try {
    const userExists = await Parent.findOne({ email });

    if (userExists) {
      return sendError(res, 'User already exists', 'USER_EXISTS', 400);
    }

    const passwordHash = await hashPassword(password);
    const parent = await Parent.create({
      fullName,
      email,
      passwordHash,
    });

    if (parent) {
      sendSuccess(res, {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        token: generateToken(String(parent._id)),
      }, 'Registration successful', 201);
    } else {
      sendError(res, 'Invalid user data', 'INVALID_DATA', 400);
    }
  } catch (error: any) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const parent = await Parent.findOne({ email });

    if (parent && (await matchPassword(password, parent.passwordHash))) {
      sendSuccess(res, {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        token: generateToken(String(parent._id)),
      }, 'Login successful');
    } else {
      sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }
  } catch (error: any) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const parent = await Parent.findById(req.user._id).select('-passwordHash');
    if (parent) {
      sendSuccess(res, parent, 'User fetched successfully');
    } else {
      sendError(res, 'User not found', 'NOT_FOUND', 404);
    }
  } catch (error: any) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const logout = async (req: Request, res: Response) => {
  // Since we use JWT, logout is primarily handled on the client by destroying the token
  // A robust approach might involve a token blacklist in Redis, but for Phase 1:
  sendSuccess(res, {}, 'Logout successful');
};
