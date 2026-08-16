"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_config_1 = require("../config/env.config");
const { combine, timestamp, printf, colorize } = winston_1.default.format;
// Add custom levels
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        security: 2,
        audit: 3,
        info: 4,
        debug: 5
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        security: 'magenta',
        audit: 'cyan',
        info: 'green',
        debug: 'blue'
    }
};
winston_1.default.addColors(customLevels.colors);
// Custom log format
const customFormat = printf(({ level, message, timestamp, requestId, userId, ...metadata }) => {
    let msg = `[${timestamp}] [${level.toUpperCase()}]`;
    if (requestId)
        msg += ` [REQ:${requestId}]`;
    if (userId)
        msg += ` [USR:${userId}]`;
    msg += ` ${message}`;
    const sanitize = (data) => {
        if (typeof data !== 'object' || data === null)
            return data;
        const scrubbed = { ...data };
        const sensitiveKeys = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'key'];
        for (const key of Object.keys(scrubbed)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                scrubbed[key] = '[REDACTED]';
            }
            else if (typeof scrubbed[key] === 'object') {
                scrubbed[key] = sanitize(scrubbed[key]);
            }
        }
        return scrubbed;
    };
    const safeContext = sanitize(metadata);
    if (Object.keys(safeContext).length > 0) {
        msg += ` | Context: ${JSON.stringify(safeContext)}`;
    }
    return msg;
});
const winstonLogger = winston_1.default.createLogger({
    levels: customLevels.levels,
    level: env_config_1.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
        })
    ]
});
exports.logger = {
    info: (msg, meta) => winstonLogger.log('info', msg, meta),
    warn: (msg, meta) => winstonLogger.log('warn', msg, meta),
    error: (msg, meta) => winstonLogger.log('error', msg, meta),
    security: (msg, meta) => winstonLogger.log('security', msg, meta),
    audit: (msg, meta) => winstonLogger.log('audit', msg, meta),
};
