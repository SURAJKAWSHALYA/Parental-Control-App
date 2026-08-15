import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = req.user.familyId;
    const { action, actorId, limit = 50, page = 1 } = req.query;

    const query: any = { familyId };
    
    if (action) query.action = action;
    if (actorId) query.actorId = actorId;

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    sendSuccess(res, { logs, total, page: Number(page), limit: Number(limit) }, 'Audit logs retrieved');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
