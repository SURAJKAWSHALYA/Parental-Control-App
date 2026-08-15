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
exports.Geofence = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GeofenceSchema = new mongoose_1.Schema({
    childId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Device', required: true },
    placeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Place', required: true },
    // We snapshot the Place data here so Android can simply fetch Geofences 
    // without needing to join with Places locally
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    enterAlert: { type: Boolean, default: true },
    exitAlert: { type: Boolean, default: true }
}, { timestamps: true });
GeofenceSchema.index({ deviceId: 1, placeId: 1 }, { unique: true }); // A device can only have one geofence configuration per place
exports.Geofence = mongoose_1.default.model('Geofence', GeofenceSchema);
