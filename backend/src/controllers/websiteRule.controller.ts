import { Response } from 'express';
import { WebsiteRule } from '../models/WebsiteRule';
import { WebsiteCategoryRule } from '../models/WebsiteCategoryRule';
import { Child } from '../models/Child';
import { Device } from '../models/Device';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIo } from '../sockets/socketHandler';

const PREDEFINED_CATEGORIES = [
  'Adult Content',
  'Gambling',
  'Violence',
  'Drugs',
  'Social Media',
  'Gaming',
  'Streaming',
  'Shopping',
  'News',
  'Education',
  'Entertainment'
];

const verifyDeviceOwnership = async (parentId: string, deviceId: string) => {
  const children = await Child.find({ parentId }).select('_id');
  const childIds = children.map(c => c._id);
  const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });
  return device;
};

// Website Rules
export const getWebsiteRules = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const rules = await WebsiteRule.find({ deviceId });
    sendSuccess(res, rules, 'Website rules fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createWebsiteRule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;
    const { type, domain, enabled, reason } = req.body;

    if (!type || !domain) return sendError(res, 'Missing required fields', 'VALIDATION_ERROR', 400);

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    // Create or update
    const rule = await WebsiteRule.findOneAndUpdate(
      { deviceId, domain },
      { childId: device.childId, type, enabled: enabled !== undefined ? enabled : true, reason },
      { new: true, upsert: true, runValidators: true }
    );

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('website:rule:create', rule);

    sendSuccess(res, rule, 'Website rule created successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateWebsiteRule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, id } = req.params;
    const { type, enabled, reason } = req.body;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const rule = await WebsiteRule.findOne({ _id: id, deviceId });
    if (!rule) return sendError(res, 'Rule not found', 'NOT_FOUND', 404);

    if (type) rule.type = type;
    if (enabled !== undefined) rule.enabled = enabled;
    if (reason !== undefined) rule.reason = reason;

    await rule.save();

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('website:rule:update', rule);

    sendSuccess(res, rule, 'Website rule updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deleteWebsiteRule = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, id } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const rule = await WebsiteRule.findOneAndDelete({ _id: id, deviceId });
    if (!rule) return sendError(res, 'Rule not found', 'NOT_FOUND', 404);

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('website:rule:delete', { id, domain: rule.domain });

    sendSuccess(res, {}, 'Website rule deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// Categories
export const getAvailableCategories = async (req: AuthRequest, res: Response) => {
  sendSuccess(res, PREDEFINED_CATEGORIES, 'Categories fetched successfully');
};

export const getWebsiteCategories = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId } = req.params;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    let categories = await WebsiteCategoryRule.find({ deviceId });
    
    // Auto-populate default categories if they don't exist
    if (categories.length === 0) {
      const defaultCategories = PREDEFINED_CATEGORIES.map(cat => ({
        childId: device.childId,
        deviceId: device._id,
        category: cat,
        blocked: false,
        enabled: true
      }));
      await WebsiteCategoryRule.insertMany(defaultCategories);
      categories = await WebsiteCategoryRule.find({ deviceId });
    }

    sendSuccess(res, categories, 'Categories fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updateWebsiteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { deviceId, category } = req.params;
    const { blocked, enabled } = req.body;

    const device = await verifyDeviceOwnership(parentId, deviceId);
    if (!device) return sendError(res, 'Device not found or access denied', 'NOT_FOUND', 404);

    const catRule = await WebsiteCategoryRule.findOneAndUpdate(
      { deviceId, category },
      { childId: device.childId, blocked, enabled },
      { new: true, upsert: true, runValidators: true }
    );

    const io = getIo();
    if (io) io.to(`device_${deviceId}`).emit('website:category:update', catRule);

    sendSuccess(res, catRule, 'Category updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
