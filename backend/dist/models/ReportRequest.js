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
exports.ReportRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const reportRequestSchema = new mongoose_1.Schema({
    familyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Parent', required: true },
    requesterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Parent', required: true },
    type: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], required: true },
    format: { type: String, enum: ['PDF', 'CSV'], required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    dateRange: {
        start: { type: Date },
        end: { type: Date }
    },
    filters: {
        childId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Child' },
        deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device' },
        category: { type: String }
    },
    downloadUrl: { type: String },
    storageKey: { type: String },
    errorMessage: { type: String },
    expiresAt: { type: Date }
}, { timestamps: true });
// Indexes
reportRequestSchema.index({ familyId: 1, createdAt: -1 });
reportRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion of expired reports
exports.ReportRequest = mongoose_1.default.model('ReportRequest', reportRequestSchema);
