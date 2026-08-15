"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWebsiteCategory = exports.getWebsiteCategories = exports.getAvailableCategories = exports.deleteWebsiteRule = exports.updateWebsiteRule = exports.createWebsiteRule = exports.getWebsiteRules = void 0;
const WebsiteRule_1 = require("../models/WebsiteRule");
const WebsiteCategoryRule_1 = require("../models/WebsiteCategoryRule");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const socketHandler_1 = require("../sockets/socketHandler");
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
const verifyDeviceOwnership = async (parentId, deviceId) => {
    const children = await Child_1.Child.find({ parentId }).select('_id');
    const childIds = children.map(c => c._id);
    const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
    return device;
};
// Website Rules
const getWebsiteRules = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const rules = await WebsiteRule_1.WebsiteRule.find({ deviceId });
        (0, response_1.sendSuccess)(res, rules, 'Website rules fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getWebsiteRules = getWebsiteRules;
const createWebsiteRule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { type, domain, enabled, reason } = req.body;
        if (!type || !domain)
            return (0, response_1.sendError)(res, 'Missing required fields', 'VALIDATION_ERROR', 400);
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        // Create or update
        const rule = await WebsiteRule_1.WebsiteRule.findOneAndUpdate({ deviceId, domain }, { childId: device.childId, type, enabled: enabled !== undefined ? enabled : true, reason }, { new: true, upsert: true, runValidators: true });
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('website:rule:create', rule);
        (0, response_1.sendSuccess)(res, rule, 'Website rule created successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createWebsiteRule = createWebsiteRule;
const updateWebsiteRule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, id } = req.params;
        const { type, enabled, reason } = req.body;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const rule = await WebsiteRule_1.WebsiteRule.findOne({ _id: id, deviceId });
        if (!rule)
            return (0, response_1.sendError)(res, 'Rule not found', 'NOT_FOUND', 404);
        if (type)
            rule.type = type;
        if (enabled !== undefined)
            rule.enabled = enabled;
        if (reason !== undefined)
            rule.reason = reason;
        await rule.save();
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('website:rule:update', rule);
        (0, response_1.sendSuccess)(res, rule, 'Website rule updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateWebsiteRule = updateWebsiteRule;
const deleteWebsiteRule = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, id } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const rule = await WebsiteRule_1.WebsiteRule.findOneAndDelete({ _id: id, deviceId });
        if (!rule)
            return (0, response_1.sendError)(res, 'Rule not found', 'NOT_FOUND', 404);
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('website:rule:delete', { id, domain: rule.domain });
        (0, response_1.sendSuccess)(res, {}, 'Website rule deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deleteWebsiteRule = deleteWebsiteRule;
// Categories
const getAvailableCategories = async (req, res) => {
    (0, response_1.sendSuccess)(res, PREDEFINED_CATEGORIES, 'Categories fetched successfully');
};
exports.getAvailableCategories = getAvailableCategories;
const getWebsiteCategories = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        let categories = await WebsiteCategoryRule_1.WebsiteCategoryRule.find({ deviceId });
        // Auto-populate default categories if they don't exist
        if (categories.length === 0) {
            const defaultCategories = PREDEFINED_CATEGORIES.map(cat => ({
                childId: device.childId,
                deviceId: device._id,
                category: cat,
                blocked: false,
                enabled: true
            }));
            await WebsiteCategoryRule_1.WebsiteCategoryRule.insertMany(defaultCategories);
            categories = await WebsiteCategoryRule_1.WebsiteCategoryRule.find({ deviceId });
        }
        (0, response_1.sendSuccess)(res, categories, 'Categories fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getWebsiteCategories = getWebsiteCategories;
const updateWebsiteCategory = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId, category } = req.params;
        const { blocked, enabled } = req.body;
        const device = await verifyDeviceOwnership(parentId, deviceId);
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        const catRule = await WebsiteCategoryRule_1.WebsiteCategoryRule.findOneAndUpdate({ deviceId, category }, { childId: device.childId, blocked, enabled }, { new: true, upsert: true, runValidators: true });
        const io = (0, socketHandler_1.getIo)();
        if (io)
            io.to(`device_${deviceId}`).emit('website:category:update', catRule);
        (0, response_1.sendSuccess)(res, catRule, 'Category updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updateWebsiteCategory = updateWebsiteCategory;
