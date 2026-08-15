import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationRecord extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  packageName: string;
  appName: string;
  notificationTitle?: string;
  notificationText?: string;
  category: string;
  isSensitive: boolean;
  timestamp: Date;
  createdAt: Date;
}

const notificationRecordSchema = new Schema<INotificationRecord>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    packageName: { type: String, required: true },
    appName: { type: String, required: true },
    notificationTitle: { type: String },
    notificationText: { type: String },
    category: { 
      type: String, 
      enum: ['Social', 'Messaging', 'Email', 'System', 'Other'],
      default: 'Other'
    },
    isSensitive: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying by device, child, and date
notificationRecordSchema.index({ deviceId: 1, timestamp: -1 });
notificationRecordSchema.index({ childId: 1, timestamp: -1 });
notificationRecordSchema.index({ packageName: 1 });

export const NotificationRecord = mongoose.model<INotificationRecord>('NotificationRecord', notificationRecordSchema);
