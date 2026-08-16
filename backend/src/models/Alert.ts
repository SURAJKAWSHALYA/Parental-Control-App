import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  count: number;
  lastOccurredAt: Date;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    isRead: { type: Boolean, default: false },
    count: { type: Number, default: 1 },
    lastOccurredAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ parentId: 1, createdAt: -1 });
alertSchema.index({ childId: 1, deviceId: 1, createdAt: -1 });
alertSchema.index({ deviceId: 1, type: 1, isRead: 1 });

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
