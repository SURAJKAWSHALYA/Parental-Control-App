import mongoose, { Document, Schema } from 'mongoose';

export interface IAlertRule extends Document {
  parentId: mongoose.Types.ObjectId;
  childId?: mongoose.Types.ObjectId; // Optional: Can apply globally or to a specific child
  type: string; // e.g., 'DEVICE_OFFLINE', 'WEBSITE_RESTRICTION'
  enabled: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cooldownMinutes: number;
  quietHours: {
    enabled: boolean;
    start: string; // e.g., '22:00'
    end: string;   // e.g., '07:00'
    ignoreCritical: boolean; // if true, critical alerts ignore quiet hours
  };
  createdAt: Date;
  updatedAt: Date;
}

const alertRuleSchema = new Schema<IAlertRule>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child' },
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    severity: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    cooldownMinutes: { type: Number, default: 0 },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '07:00' },
      ignoreCritical: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a parent can only have one rule of a specific type per child (or global)
alertRuleSchema.index({ parentId: 1, childId: 1, type: 1 }, { unique: true });

export const AlertRule = mongoose.model<IAlertRule>('AlertRule', alertRuleSchema);
