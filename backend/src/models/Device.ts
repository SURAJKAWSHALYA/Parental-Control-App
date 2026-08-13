import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  childId: mongoose.Types.ObjectId;
  deviceName: string;
  androidVersion: string;
  manufacturer: string;
  deviceModel: string;
  batteryLevel: number;
  isOnline: boolean;
  permissions: {
    usageAccess: boolean;
    notifications: boolean;
    location: boolean;
  };
  lastSeen: Date;
  appVersion: string;
  createdAt: Date;
  updatedAt: Date;
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
    permissions: {
      usageAccess: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      location: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
