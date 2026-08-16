import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  description: string;
  metadata?: any;
  isForeground?: boolean;
  timestamp: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    type: { 
      type: String, 
      enum: ['APP_INSTALL', 'APP_UNINSTALL', 'WEB_VISIT', 'LOCATION_CHANGE', 'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'SAFETY', 'CHAT_SAFETY_EVENT', 'MEDIA_FLAGGED'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    isForeground: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for fetching recent activities per device rapidly
activitySchema.index({ deviceId: 1, timestamp: -1 });
activitySchema.index({ childId: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
