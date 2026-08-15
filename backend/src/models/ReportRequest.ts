import mongoose, { Document, Schema } from 'mongoose';

export interface IReportRequest extends Document {
  familyId: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  format: 'PDF' | 'CSV';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    childId?: mongoose.Types.ObjectId;
    deviceId?: mongoose.Types.ObjectId;
    category?: string;
  };
  downloadUrl?: string;
  storageKey?: string;
  errorMessage?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportRequestSchema = new Schema<IReportRequest>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    type: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'], required: true },
    format: { type: String, enum: ['PDF', 'CSV'], required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    dateRange: {
      start: { type: Date },
      end: { type: Date }
    },
    filters: {
      childId: { type: Schema.Types.ObjectId, ref: 'Child' },
      deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
      category: { type: String }
    },
    downloadUrl: { type: String },
    storageKey: { type: String },
    errorMessage: { type: String },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
reportRequestSchema.index({ familyId: 1, createdAt: -1 });
reportRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion of expired reports

export const ReportRequest = mongoose.model<IReportRequest>('ReportRequest', reportRequestSchema);
