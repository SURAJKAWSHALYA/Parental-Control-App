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
exports.AppUsage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const appUsageSchema = new mongoose_1.Schema({
    deviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    },
    childId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
    },
    packageName: {
        type: String,
        required: true,
    },
    appName: {
        type: String,
        required: true,
    },
    usageDate: {
        // Stores the start of the day (00:00:00) for aggregation
        type: Date,
        required: true,
    },
    usageDuration: {
        type: Number,
        default: 0,
    },
    launchCount: {
        type: Number,
        default: 0,
    },
    firstUsedAt: {
        type: Date,
    },
    lastUsedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Compound index to prevent duplicate records for the same app on the same day on a device
appUsageSchema.index({ deviceId: 1, packageName: 1, usageDate: 1 }, { unique: true });
appUsageSchema.index({ childId: 1, usageDate: 1 });
exports.AppUsage = mongoose_1.default.model('AppUsage', appUsageSchema);
