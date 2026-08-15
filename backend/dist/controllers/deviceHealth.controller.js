"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceHealth = void 0;
const response_1 = require("../utils/response");
const DeviceHealth_1 = require("../models/DeviceHealth");
const Child_1 = require("../models/Child");
const getDeviceHealth = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const parentId = req.user.familyId;
        // Verify ownership
        const children = await Child_1.Child.find({ parentId }).select('_id');
        const childIds = children.map(c => c._id);
        // We import Device just to check ownership, but instead we could just verify if DeviceHealth exists
        // and if the related device belongs to this parent. A quick way is to check Device.
        const { Device } = await Promise.resolve().then(() => __importStar(require('../models/Device')));
        const device = await Device.findOne({ _id: deviceId, childId: { $in: childIds } });
        if (!device) {
            return (0, response_1.sendError)(res, 'Device not found or unauthorized', 'NOT_FOUND', 404);
        }
        const health = await DeviceHealth_1.DeviceHealth.findOne({ deviceId });
        if (!health) {
            return (0, response_1.sendError)(res, 'No health data available for this device', 'NOT_FOUND', 404);
        }
        (0, response_1.sendSuccess)(res, health, 'Device health retrieved successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getDeviceHealth = getDeviceHealth;
