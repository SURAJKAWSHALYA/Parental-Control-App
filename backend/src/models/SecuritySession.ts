import mongoose, { Document, Schema } from 'mongoose';

export interface ISecuritySession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenIdentifier: string; // jti (JWT ID) or refresh token hash
  deviceInfo: string;
  ipAddress: string;
  isActive: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

const SecuritySessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Parent',
    required: true,
    index: true
  },
  tokenIdentifier: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Auto-delete expired sessions
SecuritySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISecuritySession>('SecuritySession', SecuritySessionSchema);
