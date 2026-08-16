import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { Parent } from '../models/Parent';
import { AuditService } from '../services/AuditService';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Invite a Co-Parent
export const inviteCoParent = async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, permissions } = req.body;
    const ownerId = req.user.familyId; // Since req.user is OWNER, familyId === _id

    if (req.user.role !== 'OWNER') {
      return sendError(res, 'Only the family owner can invite co-parents', 'FORBIDDEN', 403);
    }

    // Create an account with a randomly generated secure password.
    // In a full production system with email, send a reset link instead.
    const existingUser = await Parent.findOne({ email });
    if (existingUser) {
      return sendError(res, 'User already exists', 'CONFLICT', 409);
    }

    const generatedPassword = crypto.randomBytes(12).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(generatedPassword, salt);

    const coParent = await Parent.create({
      email,
      fullName,
      passwordHash,
      familyId: ownerId,
      role: 'CO_PARENT',
      permissions: permissions || ['VIEW_ONLY']
    });

    await AuditService.logAction(
      ownerId,
      req.user.id,
      req.user.role,
      'INVITE_CO_PARENT',
      'Parent',
      coParent._id.toString(),
      { email, permissions },
      req.ip,
      (req as any).id
    );

    // Return the generated password ONCE so the owner can share it securely.
    sendSuccess(res, { id: coParent._id, email: coParent.email, role: coParent.role, temporaryPassword: generatedPassword }, 'Co-parent invited successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// List Family Members
export const getFamilyMembers = async (req: AuthRequest, res: Response) => {
  try {
    const familyId = req.user.familyId;
    const members = await Parent.find({ 
      $or: [{ _id: familyId }, { familyId: familyId }]
    }).select('-passwordHash');

    sendSuccess(res, members, 'Family members retrieved');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Update Permissions
export const updatePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (req.user.role !== 'OWNER') {
      return sendError(res, 'Only the family owner can update permissions', 'FORBIDDEN', 403);
    }

    const member = await Parent.findOne({ _id: id, familyId: req.user.familyId, role: 'CO_PARENT' });
    if (!member) {
      return sendError(res, 'Co-parent not found', 'NOT_FOUND', 404);
    }

    member.permissions = permissions;
    await member.save();

    await AuditService.logAction(
      req.user.familyId,
      req.user.id,
      req.user.role,
      'UPDATE_PERMISSIONS',
      'Parent',
      member._id.toString(),
      { newPermissions: permissions },
      req.ip,
      (req as any).id
    );

    sendSuccess(res, member, 'Permissions updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Data Deletion
export const deleteFamilyData = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'OWNER') {
      return sendError(res, 'Only the family owner can delete family data', 'FORBIDDEN', 403);
    }

    const familyId = req.user.familyId;
    
    // TODO: Verify 2FA code or password here before deletion
    // Currently proceeding without 2FA for initial version.
    
    // Deleting all family data
    const { Child } = await import('../models/Child');
    const { Device } = await import('../models/Device');
    const { Activity } = await import('../models/Activity');
    const { MediaAsset } = await import('../models/MediaAsset');
    
    const children = await Child.find({ parentId: familyId }).select('_id');
    const childIds = children.map(c => c._id);
    
    await Activity.deleteMany({ childId: { $in: childIds } });
    await MediaAsset.deleteMany({ familyId });
    await Device.deleteMany({ childId: { $in: childIds } });
    await Child.deleteMany({ parentId: familyId });
    // And so on for other collections...

    await AuditService.logAction(
      familyId,
      req.user.id,
      req.user.role,
      'DELETE_FAMILY_DATA',
      'Family',
      familyId,
      {},
      req.ip,
      (req as any).id
    );

    sendSuccess(res, {}, 'Family data scheduled for deletion');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
