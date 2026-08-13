import mongoose, { Document, Schema } from 'mongoose';

export interface IPairingCode extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  code: string; // The short-lived plain string code
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const pairingCodeSchema = new Schema<IPairingCode>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired codes (TTL index)
pairingCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PairingCode = mongoose.model<IPairingCode>('PairingCode', pairingCodeSchema);
