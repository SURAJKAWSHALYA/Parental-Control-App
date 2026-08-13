import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteCategoryRule extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  category: string;
  blocked: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteCategoryRuleSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    category: { type: String, required: true },
    blocked: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate categories per device
WebsiteCategoryRuleSchema.index({ deviceId: 1, category: 1 }, { unique: true });

export const WebsiteCategoryRule = mongoose.model<IWebsiteCategoryRule>('WebsiteCategoryRule', WebsiteCategoryRuleSchema);
