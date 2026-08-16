import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  childId: mongoose.Types.ObjectId;
  deviceName: string;
  androidVersion: string;
  manufacturer: string;
  deviceModel: string;
  batteryLevel: number;
  isOnline: boolean;
  permissions: IPermissionCapability[];
  notificationSettings: INotificationSettings;
  retentionSettings: IRetentionSettings;
  configurationVersion: number;
  lastSeen: Date;
  appVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionCapability {
  feature: string;
  status: 'ENABLED' | 'DISABLED' | 'NOT_GRANTED' | 'NOT_SUPPORTED' | 'REQUIRES_SETUP' | 'UNKNOWN';
  requiredPermission: string;
  androidCapability: string;
  lastChecked: Date;
  lastSynchronized: Date;
}

export interface INotificationSettings {
  enabled: boolean;
  retentionDays: number; // Legacy
}

export interface IRetentionSettings {
  activityDays: number;
  notificationDays: number;
  callsDays: number;
  smsDays: number;
  safetyEventsDays: number;
}

const deviceSchema = new Schema<IDevice>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    androidVersion: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    deviceModel: {
      type: String,
      required: true,
    },
    batteryLevel: {
      type: Number,
      default: 100,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    appVersion: {
      type: String,
      required: true,
    },
    permissions: [{
      feature: String,
      status: { 
        type: String, 
        enum: ['ENABLED', 'DISABLED', 'NOT_GRANTED', 'NOT_SUPPORTED', 'REQUIRES_SETUP', 'UNKNOWN'],
        default: 'UNKNOWN' 
      },
      requiredPermission: String,
      androidCapability: String,
      lastChecked: { type: Date, default: Date.now },
      lastSynchronized: { type: Date, default: Date.now },
    }],
    notificationSettings: {
      enabled: { type: Boolean, default: true },
      retentionDays: { type: Number, default: 7 },
    },
    retentionSettings: {
      activityDays: { type: Number, default: 30 },
      notificationDays: { type: Number, default: 30 },
      callsDays: { type: Number, default: 30 },
      smsDays: { type: Number, default: 30 },
      safetyEventsDays: { type: Number, default: 90 },
    },
    configurationVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid lookups by parent or child
deviceSchema.index({ parentId: 1, childId: 1 });
deviceSchema.index({ childId: 1, isOnline: 1 });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
