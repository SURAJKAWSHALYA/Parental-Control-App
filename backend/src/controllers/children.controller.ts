import { Response } from 'express';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getChildren = async (req: AuthRequest, res: Response) => {
  try {
    const children = await Child.find({ parentId: req.user._id });
    sendSuccess(res, children, 'Children fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const addChild = async (req: AuthRequest, res: Response) => {
  try {
    const { name, dateOfBirth, avatar } = req.body;
    if (!name || !dateOfBirth) {
      return sendError(res, 'Name and Date of Birth are required', 'VALIDATION_ERROR', 400);
    }

    const child = await Child.create({
      parentId: req.user._id,
      name,
      dateOfBirth,
      avatar: avatar || '',
    });

    sendSuccess(res, child, 'Child added successfully', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getChild = async (req: AuthRequest, res: Response) => {
  try {
    const child = await Child.findOne({ _id: req.params.id, parentId: req.user._id });
    if (!child) return sendError(res, 'Child not found', 'NOT_FOUND', 404);
    
    sendSuccess(res, child, 'Child fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateChild = async (req: AuthRequest, res: Response) => {
  try {
    const { name, dateOfBirth, avatar } = req.body;
    const child = await Child.findOneAndUpdate(
      { _id: req.params.id, parentId: req.user._id },
      { name, dateOfBirth, avatar },
      { new: true, runValidators: true }
    );
    
    if (!child) return sendError(res, 'Child not found', 'NOT_FOUND', 404);
    sendSuccess(res, child, 'Child updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteChild = async (req: AuthRequest, res: Response) => {
  try {
    const child = await Child.findOneAndDelete({ _id: req.params.id, parentId: req.user._id });
    if (!child) return sendError(res, 'Child not found', 'NOT_FOUND', 404);

    // Delete associated devices
    await Device.deleteMany({ childId: child._id });
    // Should also delete associated PairingCodes, Activity, etc., in the future.

    sendSuccess(res, {}, 'Child deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
