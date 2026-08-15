import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceHealth extends Document {
  deviceId: mongoose.Types.ObjectId;
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'WIFI' | 'MOBILE' | 'NONE' | 'UNKNOWN';
  storageUsed: number; // bytes
  storageTotal: number; // bytes
  androidVersion: string;
  appVersion: string;
  lastSeen: Date;
  syncStatus: 'SYNCING' | 'SYNCED' | 'FAILED' | 'UNKNOWN';
  locationStatus: 'ENABLED' | 'DISABLED' | 'UNKNOWN';
  permissionStatus: 'GRANTED' | 'MISSING' | 'UNKNOWN';
  createdAt: Date;
  updatedAt: Date;
}

const deviceHealthSchema = new Schema<IDeviceHealth>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true, unique: true },
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
  },
  { timestamps: true }
);

export const DeviceHealth = mongoose.model<IDeviceHealth>('DeviceHealth', deviceHealthSchema);
