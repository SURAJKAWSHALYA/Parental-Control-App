import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  status: 'NEW' | 'VIEWED' | 'DISMISSED' | 'APPLIED';
  createdAt: Date;
  dismissedAt?: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    source: { type: String, required: true },
    status: { type: String, required: true, enum: ['NEW', 'VIEWED', 'DISMISSED', 'APPLIED'], default: 'NEW' },
    dismissedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);
