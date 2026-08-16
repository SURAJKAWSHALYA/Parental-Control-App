import mongoose, { Document, Schema } from 'mongoose';

export interface IFailedJob extends Document {
  jobId: string;
  type: string; // e.g., 'media_processing', 'ai_report', 'safety_alert'
  payload: any;
  error: string;
  attempts: number;
  createdAt: Date;
  failedAt: Date;
  status: 'pending_retry' | 'dead_letter';
}

const FailedJobSchema: Schema = new Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  error: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  failedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending_retry', 'dead_letter'],
    default: 'dead_letter',
    index: true
  }
});

export default mongoose.model<IFailedJob>('FailedJob', FailedJobSchema);
