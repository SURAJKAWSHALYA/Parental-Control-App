"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.protectDevice = exports.protect = void 0;
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
            const parent = await Parent_1.Parent.findById(decoded.id).select('-passwordHash');
            if (!parent) {
                return (0, response_1.sendError)(res, 'Not authorized, user not found', 'UNAUTHORIZED', 401);
            }
            // Inject familyId transparently. If no familyId exists, they are the OWNER, so their ID is the familyId
            const userObj = parent.toObject();
            req.user = {
                ...userObj,
                id: userObj._id, // Ensure .id works for legacy code
                familyId: userObj.familyId || userObj._id
            };
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
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'Not authorized', 'UNAUTHORIZED', 401);
        }
        // Owners bypass permission checks
        if (req.user.role === 'OWNER') {
            return next();
        }
        if (req.user.permissions && req.user.permissions.includes(permission)) {
            return next();
        }
        return (0, response_1.sendError)(res, `Forbidden: requires ${permission} permission`, 'FORBIDDEN', 403);
    };
};
exports.requirePermission = requirePermission;
