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
exports.DeviceHealth = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const deviceHealthSchema = new mongoose_1.Schema({
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device', required: true, unique: true },
    batteryLevel: { type: Number, required: true },
    isCharging: { type: Boolean, required: true },
    networkType: { type: String, enum: ['WIFI', 'MOBILE', 'NONE', 'UNKNOWN'], required: true },
    storageUsed: { type: Number, required: true },
    storageTotal: { type: Number, required: true },
    androidVersion: { type: String, required: true },
    appVersion: { type: String, required: true },
    lastSeen: { type: Date, required: true },
    syncStatus: { type: String, enum: ['SYNCING', 'SYNCED', 'FAILED', 'UNKNOWN'], required: true },
    locationStatus: { type: String, enum: ['ENABLED', 'DISABLED', 'UNKNOWN'], required: true },
    permissionStatus: { type: String, enum: ['GRANTED', 'MISSING', 'UNKNOWN'], required: true }
}, { timestamps: true });
exports.DeviceHealth = mongoose_1.default.model('DeviceHealth', deviceHealthSchema);
