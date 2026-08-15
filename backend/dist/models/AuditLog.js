"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const auditLogSchema = new mongoose_1.Schema({
    familyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Parent', required: true },
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Parent', required: true },
    actorRole: { type: String, enum: ['OWNER', 'CO_PARENT', 'SYSTEM'], required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: mongoose_1.Schema.Types.Mixed }, // Can be an ObjectId or string
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    ipHash: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: false } // We use explicit timestamp field
);
// Indexes for fast searching
auditLogSchema.index({ familyId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });
exports.AuditLog = mongoose_1.default.model('AuditLog', auditLogSchema);
