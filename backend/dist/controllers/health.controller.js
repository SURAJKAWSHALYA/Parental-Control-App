"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../config/env.config");
const logger_1 = require("../utils/logger");
const getSystemHealth = async (req, res) => {
    try {
        const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'OK' : 'DEGRADED';
        const aiStatus = env_config_1.env.AI_API_KEY ? 'OK' : 'DEGRADED';
        const healthData = {
            api: 'OK',
            database: dbStatus,
            socketIO: 'OK',
            storage: env_config_1.env.STORAGE_ENDPOINT ? 'OK' : 'DEGRADED',
            queue: 'OK',
            aiService: aiStatus,
            timestamp: new Date().toISOString(),
            uptimeSeconds: process.uptime()
        };
        const isSystemHealthy = dbStatus === 'OK';
        const statusCode = isSystemHealthy ? 200 : 503;
        res.status(statusCode).json({
            success: isSystemHealthy,
            data: healthData
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to perform health check'
        });
    }
};
exports.getSystemHealth = getSystemHealth;
