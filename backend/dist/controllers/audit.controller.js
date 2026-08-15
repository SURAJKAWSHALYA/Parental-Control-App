"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const response_1 = require("../utils/response");
const AuditLog_1 = require("../models/AuditLog");
const getAuditLogs = async (req, res) => {
    try {
        const familyId = req.user.familyId;
        const { action, actorId, limit = 50, page = 1 } = req.query;
        const query = { familyId };
        if (action)
            query.action = action;
        if (actorId)
            query.actorId = actorId;
        const skip = (Number(page) - 1) * Number(limit);
        const logs = await AuditLog_1.AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await AuditLog_1.AuditLog.countDocuments(query);
        (0, response_1.sendSuccess)(res, { logs, total, page: Number(page), limit: Number(limit) }, 'Audit logs retrieved');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getAuditLogs = getAuditLogs;
