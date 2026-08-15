import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyFeedback extends Document {
  eventId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  decision: 'CONFIRMED' | 'DISMISSED' | 'INCORRECT' | 'RESOLVED';
  reason?: string;
  createdAt: Date;
}

const safetyFeedbackSchema = new Schema<ISafetyFeedback>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'SafetyEvent', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    decision: { 
      type: String, 
      enum: ['CONFIRMED', 'DISMISSED', 'INCORRECT', 'RESOLVED'],
      required: true
    },
    reason: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SafetyFeedback = mongoose.model<ISafetyFeedback>('SafetyFeedback', safetyFeedbackSchema);
