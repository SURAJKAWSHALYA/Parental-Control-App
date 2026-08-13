"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivity = void 0;
const Activity_1 = require("../models/Activity");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const getActivity = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { deviceId } = req.params;
        const { page = 1, limit = 50, type } = req.query;
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        const device = await Device_1.Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device)
            return (0, response_1.sendError)(res, 'Device not found', 'NOT_FOUND', 404);
        const query = { deviceId };
        if (type)
            query.type = type;
        const activities = await Activity_1.Activity.find(query)
            .sort({ timestamp: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        (0, response_1.sendSuccess)(res, activities, 'Activity fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getActivity = getActivity;
