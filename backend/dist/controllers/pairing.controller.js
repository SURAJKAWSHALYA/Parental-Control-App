"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDevice = exports.createPairingCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const PairingCode_1 = require("../models/PairingCode");
const Child_1 = require("../models/Child");
const Device_1 = require("../models/Device");
const response_1 = require("../utils/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Generate a random 6 character alphanumeric code
const generateShortCode = () => {
    return crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
};
const createPairingCode = async (req, res) => {
    try {
        const { childId } = req.body;
        if (!childId)
            return (0, response_1.sendError)(res, 'Child ID is required', 'VALIDATION_ERROR', 400);
        // Verify child belongs to parent
        const child = await Child_1.Child.findOne({ _id: childId, parentId: req.user._id });
        if (!child)
            return (0, response_1.sendError)(res, 'Child not found', 'NOT_FOUND', 404);
        const code = generateShortCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        const pairingCode = await PairingCode_1.PairingCode.create({
            parentId: req.user._id,
            childId,
            code,
            expiresAt,
        });
        (0, response_1.sendSuccess)(res, { code: pairingCode.code, expiresAt: pairingCode.expiresAt }, 'Pairing code generated successfully', 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createPairingCode = createPairingCode;
const connectDevice = async (req, res) => {
    try {
        const { code, deviceName, androidVersion, manufacturer, deviceModel, appVersion, batteryLevel } = req.body;
        if (!code || !deviceName || !androidVersion || !manufacturer || !deviceModel || !appVersion) {
            return (0, response_1.sendError)(res, 'Missing device information or pairing code', 'VALIDATION_ERROR', 400);
        }
        const pairingCode = await PairingCode_1.PairingCode.findOne({ code, usedAt: null, expiresAt: { $gt: new Date() } });
        if (!pairingCode) {
            return (0, response_1.sendError)(res, 'Invalid or expired pairing code', 'INVALID_CODE', 400);
        }
        // Register device
        const device = await Device_1.Device.create({
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
        const deviceToken = jsonwebtoken_1.default.sign({ id: device._id, childId: device.childId, role: 'device' }, process.env.JWT_SECRET, { expiresIn: '365d' } // Long lived for devices
        );
        (0, response_1.sendSuccess)(res, { deviceId: device._id, token: deviceToken }, 'Device paired successfully', 200);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.connectDevice = connectDevice;
