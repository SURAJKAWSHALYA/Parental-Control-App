import mongoose, { Document, Schema } from 'mongoose';

export interface IAppLimit extends Document {
  deviceId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  packageName: string;
  appName: string;
  dailyLimitMinutes: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appLimitSchema = new Schema<IAppLimit>(
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
    dailyLimitMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate limits for the same device + package
appLimitSchema.index({ deviceId: 1, packageName: 1 }, { unique: true });
appLimitSchema.index({ childId: 1 });

export const AppLimit = mongoose.model<IAppLimit>('AppLimit', appLimitSchema);
