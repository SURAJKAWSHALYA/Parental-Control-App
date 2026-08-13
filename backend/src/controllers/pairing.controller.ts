import { Request, Response } from 'express';
import crypto from 'crypto';
import { PairingCode } from '../models/PairingCode';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

// Generate a random 6 character alphanumeric code
const generateShortCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

export const createPairingCode = async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.body;
    if (!childId) return sendError(res, 'Child ID is required', 'VALIDATION_ERROR', 400);

    // Verify child belongs to parent
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return sendError(res, 'Child not found', 'NOT_FOUND', 404);

    const code = generateShortCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const pairingCode = await PairingCode.create({
      parentId: req.user._id,
      childId,
      code,
      expiresAt,
    });

    sendSuccess(res, { code: pairingCode.code, expiresAt: pairingCode.expiresAt }, 'Pairing code generated successfully', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const connectDevice = async (req: Request, res: Response) => {
  try {
    const { code, deviceName, androidVersion, manufacturer, deviceModel, appVersion, batteryLevel } = req.body;

    if (!code || !deviceName || !androidVersion || !manufacturer || !deviceModel || !appVersion) {
      return sendError(res, 'Missing device information or pairing code', 'VALIDATION_ERROR', 400);
    }

    const pairingCode = await PairingCode.findOne({ code, usedAt: null, expiresAt: { $gt: new Date() } });
    if (!pairingCode) {
      return sendError(res, 'Invalid or expired pairing code', 'INVALID_CODE', 400);
    }

    // Register device
    const device = await Device.create({
      childId: pairingCode.childId,
      deviceName,
      androidVersion,
      manufacturer,
      deviceModel,
      appVersion,
      batteryLevel: batteryLevel || 100,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Mark code as used
    pairingCode.usedAt = new Date();
    await pairingCode.save();

    // Generate device JWT token
    const deviceToken = jwt.sign(
      { id: device._id, childId: device.childId, role: 'device' },
      process.env.JWT_SECRET as string,
      { expiresIn: '365d' } // Long lived for devices
    );

    sendSuccess(res, { deviceId: device._id, token: deviceToken }, 'Device paired successfully', 200);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
