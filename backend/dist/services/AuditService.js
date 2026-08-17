"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const AuditLog_1 = require("../models/AuditLog");
class AuditService {
    /**
     * Logs a security or configuration action.
     */
    static async logAction(familyId, actorId, actorRole, action, resourceType, resourceId, metadata, ipAddress, requestId, result = 'SUCCESS') {
        try {
            // Create an IP hash instead of storing raw IP to respect privacy requirements
            const ipHash = ipAddress
                ? crypto_1.default.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16)
                : undefined;
            await AuditLog_1.AuditLog.create({
                familyId,
                actorId,
                actorRole,
                action,
                resourceType,
                resourceId,
                metadata,
                ipHash,
                requestId,
                result,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Failed to write audit log:', error);
            // We don't throw here to avoid failing the main business transaction, 
            // but in strict mode we might want to.
        }
    }
}
exports.AuditService = AuditService;
