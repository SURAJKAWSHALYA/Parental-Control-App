import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyEvent extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  source: 'Notification' | 'SMS' | 'Image' | 'Activity' | 'System' | 'FAMILY_CHAT_MEDIA' | 'FAMILY_CHAT_MESSAGE';
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  title: string;
  description: string;
  evidenceType: string;
  evidenceData?: any; // To store minimal info like messagePreview or numberHash
  status: 'NEW' | 'REVIEWED' | 'DISMISSED' | 'RESOLVED';
  isRead: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const safetyEventSchema = new Schema<ISafetyEvent>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    source: { 
      type: String, 
      enum: ['Notification', 'SMS', 'Image', 'Activity', 'System', 'FAMILY_CHAT_MEDIA', 'FAMILY_CHAT_MESSAGE'],
      required: true
    },
    category: { type: String, required: true },
    severity: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true
    },
    confidence: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    evidenceType: { type: String, required: true },
    evidenceData: { type: Schema.Types.Mixed },
    status: { 
      type: String, 
      enum: ['NEW', 'REVIEWED', 'DISMISSED', 'RESOLVED'],
      default: 'NEW'
    },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

safetyEventSchema.index({ parentId: 1, timestamp: -1 });
safetyEventSchema.index({ childId: 1, status: 1 });

export const SafetyEvent = mongoose.model<ISafetyEvent>('SafetyEvent', safetyEventSchema);
