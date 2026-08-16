"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const env_config_1 = require("../config/env.config");
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const message = err.message || 'Internal Server Error';
    // Create safe error context without sensitive tokens
    const errorContext = {
        route: req.originalUrl,
        method: req.method,
        errorType: err.name,
        stack: env_config_1.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    logger_1.logger.error(message, {
        requestId: req.id,
        userId: req.user?.id,
        ...errorContext
    });
    // In production, mask generic errors
    const safeMessage = (env_config_1.env.NODE_ENV === 'production' && statusCode >= 500)
        ? 'An unexpected error occurred.'
        : message;
    (0, response_1.sendError)(res, safeMessage, err.name || 'SERVER_ERROR', statusCode, req.id);
};
exports.errorHandler = errorHandler;
