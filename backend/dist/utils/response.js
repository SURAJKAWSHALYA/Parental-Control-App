"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Something went wrong', errorCode = 'SERVER_ERROR', statusCode = 500, requestId) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        requestId,
    });
};
exports.sendError = sendError;
