import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaAsset extends Document {
  familyId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  uploaderId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: 'IMAGE' | 'VIDEO';
  storageKey: string;
  thumbnailKey?: string;
  mimeType: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  safetyStatus: 'SAFE' | 'REVIEW' | 'FLAGGED' | 'UNKNOWN';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<IMediaAsset>(
  {
    familyId: { type: Schema.Types.ObjectId, required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    uploaderId: { type: Schema.Types.ObjectId, required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { type: String, enum: ['IMAGE', 'VIDEO'], required: true },
    storageKey: { type: String, required: true },
    thumbnailKey: { type: String },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    },
    duration: { type: Number },
    safetyStatus: {
      type: String,
      enum: ['SAFE', 'REVIEW', 'FLAGGED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Optional: Index to automatically delete expired documents if MongoDB TTL is desired
// mediaAssetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
mediaAssetSchema.index({ familyId: 1, createdAt: -1 });
mediaAssetSchema.index({ safetyStatus: 1 });

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', mediaAssetSchema);
