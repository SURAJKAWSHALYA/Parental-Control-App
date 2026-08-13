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
  },
  {
    timestamps: true,
  }
);

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
