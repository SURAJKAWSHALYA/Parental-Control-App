import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  familyId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: 'OWNER' | 'CO_PARENT' | 'SYSTEM';
  action: string;
  resourceType: string;
  resourceId?: mongoose.Types.ObjectId | string;
  metadata?: any;
  ipHash?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    actorRole: { type: String, enum: ['OWNER', 'CO_PARENT', 'SYSTEM'], required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.Mixed }, // Can be an ObjectId or string
    metadata: { type: Schema.Types.Mixed },
    ipHash: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false } // We use explicit timestamp field
);

// Indexes for fast searching
auditLogSchema.index({ familyId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
