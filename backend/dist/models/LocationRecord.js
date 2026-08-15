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
exports.LocationRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LocationRecordSchema = new mongoose_1.Schema({
    childId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device', required: true },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    accuracy: { type: Number, required: true },
    altitude: { type: Number },
    speed: { type: Number },
    heading: { type: Number },
    battery: { type: Number },
    source: { type: String, default: 'fused' }, // e.g., gps, network, fused
    timestamp: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
// Indexes for fast history querying
LocationRecordSchema.index({ deviceId: 1, timestamp: -1 });
LocationRecordSchema.index({ childId: 1, timestamp: -1 });
exports.LocationRecord = mongoose_1.default.model('LocationRecord', LocationRecordSchema);
