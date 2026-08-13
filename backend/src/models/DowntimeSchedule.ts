import mongoose, { Document, Schema } from 'mongoose';

export interface IDowntimeSchedule extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  name: string;
  days: number[]; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format (e.g. "22:00")
  endTime: string; // HH:mm format (e.g. "06:30")
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const downtimeScheduleSchema = new Schema<IDowntimeSchedule>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    name: { type: String, required: true },
    days: { type: [Number], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

downtimeScheduleSchema.index({ deviceId: 1 });

export const DowntimeSchedule = mongoose.model<IDowntimeSchedule>('DowntimeSchedule', downtimeScheduleSchema);
