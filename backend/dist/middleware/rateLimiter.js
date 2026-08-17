"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const isProd = process.env.NODE_ENV === 'production';
// API global limiter - 15 minutes window
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 5000, // 300 in prod, 5000 in dev
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user)
            return req.user.id || req.user.deviceId || req.ip;
        return req.ip;
    },
    message: {
        success: false,
        message: 'Too many requests, please try again after 15 minutes',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    }
});
// Authentication limiter - 1 hour window
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: isProd ? 10 : 5000, // 10 attempts per hour in prod, 5000 in dev
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.body.email || req.ip;
    },
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after an hour',
        errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});
// Media upload limiter - 1 hour window
exports.mediaLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: isProd ? 50 : 5000, // max 50 uploads per hour per IP in prod
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user)
            return req.user.id || req.user.deviceId || req.ip;
        return req.ip;
    },
    message: {
        success: false,
        message: 'Media upload quota exceeded, please try again later',
        errorCode: 'MEDIA_RATE_LIMIT_EXCEEDED'
    }
});
