import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyClassification {
  category: 'Threat' | 'Bullying' | 'Harassment' | 'Scam Indicator' | 'Explicit Content Indicator' | 'Potentially Harmful' | 'Normal' | 'Unknown';
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  source: string;
}

export interface ISmsRecord extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: 'INCOMING' | 'OUTGOING';
  senderHash: string;
  messagePreview?: string;
  timestamp: Date;
  safetyClassification: ISafetyClassification;
  createdAt: Date;
}

const smsRecordSchema = new Schema<ISmsRecord>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { 
      type: String, 
      enum: ['INCOMING', 'OUTGOING'],
      required: true
    },
    senderHash: { type: String, required: true },
    messagePreview: { type: String },
    timestamp: { type: Date, required: true },
    safetyClassification: {
      category: { type: String, default: 'Unknown' },
      confidence: { type: Number, default: 0 },
      severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
      source: { type: String, default: 'System' }
    }
  },
  {
    timestamps: true,
  }
);

smsRecordSchema.index({ deviceId: 1, timestamp: -1 });
smsRecordSchema.index({ childId: 1, timestamp: -1 });
smsRecordSchema.index({ 'safetyClassification.severity': 1 });

export const SmsRecord = mongoose.model<ISmsRecord>('SmsRecord', smsRecordSchema);
