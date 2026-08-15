import mongoose, { Document, Schema } from 'mongoose';

export interface ICallRecord extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: 'INCOMING' | 'OUTGOING' | 'MISSED' | 'REJECTED';
  duration: number; // in seconds
  timestamp: Date;
  contactLabel?: string;
  numberHash: string; // Stored instead of raw phone number
  createdAt: Date;
}

const callRecordSchema = new Schema<ICallRecord>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { 
      type: String, 
      enum: ['INCOMING', 'OUTGOING', 'MISSED', 'REJECTED'],
      required: true
    },
    duration: { type: Number, default: 0 },
    timestamp: { type: Date, required: true },
    contactLabel: { type: String },
    numberHash: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

callRecordSchema.index({ deviceId: 1, timestamp: -1 });
callRecordSchema.index({ childId: 1, timestamp: -1 });

export const CallRecord = mongoose.model<ICallRecord>('CallRecord', callRecordSchema);
