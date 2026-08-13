import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  description: string;
  metadata: any;
  timestamp: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  }
);

activitySchema.index({ deviceId: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
