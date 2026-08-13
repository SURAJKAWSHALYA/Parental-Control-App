import mongoose, { Document, Schema } from 'mongoose';

export interface IAllowedApp extends Document {
  deviceId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  packageName: string;
  appName: string;
  allowedDuringDowntime: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const allowedAppSchema = new Schema<IAllowedApp>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    packageName: { type: String, required: true },
    appName: { type: String, required: true },
    allowedDuringDowntime: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate rules
allowedAppSchema.index({ deviceId: 1, packageName: 1 }, { unique: true });

export const AllowedApp = mongoose.model<IAllowedApp>('AllowedApp', allowedAppSchema);
