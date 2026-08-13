import mongoose, { Document, Schema } from 'mongoose';

export interface IAppUsage extends Document {
  deviceId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  packageName: string;
  appName: string;
  usageDate: Date;
  usageDuration: number; // in milliseconds
  launchCount: number;
  firstUsedAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appUsageSchema = new Schema<IAppUsage>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate records for the same app on the same day on a device
appUsageSchema.index({ deviceId: 1, packageName: 1, usageDate: 1 }, { unique: true });
appUsageSchema.index({ childId: 1, usageDate: 1 });

export const AppUsage = mongoose.model<IAppUsage>('AppUsage', appUsageSchema);
