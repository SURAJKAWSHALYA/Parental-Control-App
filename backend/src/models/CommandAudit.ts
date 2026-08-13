import mongoose, { Document, Schema } from 'mongoose';

export interface ICommandAudit extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  commandId: string;
  commandType: string;
  result: string;
  errorCode?: string;
  createdAt: Date;
}

const commandAuditSchema = new Schema<ICommandAudit>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    commandId: { type: String, required: true, unique: true },
    commandType: { type: String, required: true },
    result: { type: String, required: true, enum: ['SUCCESS', 'FAILED', 'PENDING'] },
    errorCode: { type: String },
  },
  {
    timestamps: true,
  }
);

export const CommandAudit = mongoose.model<ICommandAudit>('CommandAudit', commandAuditSchema);
