"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getAlert = exports.getAlerts = void 0;
const Alert_1 = require("../models/Alert");
const response_1 = require("../utils/response");
const getAlerts = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { page = 1, limit = 50 } = req.query;
        const parsedLimit = Math.min(Number(limit) || 50, 100);
        const parsedPage = Math.max(Number(page) || 1, 1);
        const alerts = await Alert_1.Alert.find({ parentId })
            .sort({ createdAt: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);
        const total = await Alert_1.Alert.countDocuments({ parentId });
        (0, response_1.sendSuccess)(res, {
            data: alerts,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit)
            }
        }, 'Alerts fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getAlerts = getAlerts;
const getAlert = async (req, res) => {
    try {
        const parentId = req.user._id;
        const alert = await Alert_1.Alert.findOne({ _id: req.params.id, parentId });
        if (!alert)
            return (0, response_1.sendError)(res, 'Alert not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, alert, 'Alert fetched');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getAlert = getAlert;
const markAsRead = async (req, res) => {
    try {
        const parentId = req.user._id;
        const alert = await Alert_1.Alert.findOneAndUpdate({ _id: req.params.id, parentId }, { isRead: true }, { new: true });
        if (!alert)
            return (0, response_1.sendError)(res, 'Alert not found', 'NOT_FOUND', 404);
        (0, response_1.sendSuccess)(res, alert, 'Alert marked as read');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const parentId = req.user._id;
        await Alert_1.Alert.updateMany({ parentId, isRead: false }, { isRead: true });
        (0, response_1.sendSuccess)(res, {}, 'All alerts marked as read');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.markAllAsRead = markAllAsRead;
