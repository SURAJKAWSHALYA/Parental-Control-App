"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageHistory = exports.getTodayUsage = exports.syncUsage = void 0;
const AppUsage_1 = require("../models/AppUsage");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const syncUsage = async (req, res) => {
    try {
        const { deviceId, childId } = req.user;
        const { usageData } = req.body;
        if (!Array.isArray(usageData)) {
            return (0, response_1.sendError)(res, 'Invalid usage data format', 'BAD_REQUEST', 400);
        }
        const bulkOps = usageData.map((usage) => {
            // Normalize usageDate to start of day
            const date = new Date(usage.usageDate);
            date.setUTCHours(0, 0, 0, 0);
            return {
                updateOne: {
                    filter: {
                        deviceId,
                        packageName: usage.packageName,
                        usageDate: date,
                    },
                    update: {
                        $set: {
                            childId,
                            appName: usage.appName,
                            usageDuration: usage.usageDuration,
                            launchCount: usage.launchCount,
                            firstUsedAt: usage.firstUsedAt,
                            lastUsedAt: usage.lastUsedAt,
                        }
                    },
                    upsert: true,
                }
            };
        });
        if (bulkOps.length > 0) {
            await AppUsage_1.AppUsage.bulkWrite(bulkOps);
        }
        (0, response_1.sendSuccess)(res, { success: true }, 'Usage data synced successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.syncUsage = syncUsage;
const getTodayUsage = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        // Verify parent owns this device via child
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device) {
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        }
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const usage = await AppUsage_1.AppUsage.find({
            deviceId,
            usageDate: today
        }).sort({ usageDuration: -1 });
        (0, response_1.sendSuccess)(res, usage, 'Today\'s usage fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getTodayUsage = getTodayUsage;
const getUsageHistory = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { days = 7 } = req.query;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device) {
            return (0, response_1.sendError)(res, 'Device not found or access denied', 'NOT_FOUND', 404);
        }
        const startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (Number(days) - 1));
        const usage = await AppUsage_1.AppUsage.find({
            deviceId,
            usageDate: { $gte: startDate }
        }).sort({ usageDate: 1, usageDuration: -1 });
        (0, response_1.sendSuccess)(res, usage, 'Usage history fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getUsageHistory = getUsageHistory;
