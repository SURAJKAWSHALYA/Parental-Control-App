"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectDevice = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Parent_1 = require("../models/Parent");
const response_1 = require("../utils/response");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = await Parent_1.Parent.findById(decoded.id).select('-passwordHash');
            if (!req.user) {
                return (0, response_1.sendError)(res, 'Not authorized, user not found', 'UNAUTHORIZED', 401);
            }
            next();
        }
        catch (error) {
            return (0, response_1.sendError)(res, 'Not authorized, token failed', 'UNAUTHORIZED', 401);
        }
    }
    if (!token) {
        return (0, response_1.sendError)(res, 'Not authorized, no token', 'UNAUTHORIZED', 401);
    }
};
exports.protect = protect;
const protectDevice = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'device') {
                return (0, response_1.sendError)(res, 'Invalid token role', 'UNAUTHORIZED', 401);
            }
            req.user = { deviceId: decoded.id, childId: decoded.childId }; // Using req.user as a generic authenticated entity
            next();
        }
        catch (error) {
            return (0, response_1.sendError)(res, 'Not authorized, device token failed', 'UNAUTHORIZED', 401);
        }
    }
    if (!token) {
        return (0, response_1.sendError)(res, 'Not authorized, no device token', 'UNAUTHORIZED', 401);
    }
};
exports.protectDevice = protectDevice;
