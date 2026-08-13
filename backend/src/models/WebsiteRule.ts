import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteRule extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  type: 'BLOCK' | 'ALLOW';
  domain: string;
  category?: string;
  enabled: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteRuleSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    type: { type: String, enum: ['BLOCK', 'ALLOW'], required: true },
    domain: { type: String, required: true },
    category: { type: String },
    enabled: { type: Boolean, default: true },
    reason: { type: String },
  },
  { timestamps: true }
);

// Normalize domain before saving
WebsiteRuleSchema.pre<IWebsiteRule>('save', function (next) {
  if (this.domain) {
    // Remove protocol, www., and trailing slashes
    let d = this.domain.toLowerCase();
    d = d.replace(/^(https?:\/\/)?(www\.)?/, '');
    d = d.split('/')[0];
    this.domain = d;
  }
  next();
});

export const WebsiteRule = mongoose.model<IWebsiteRule>('WebsiteRule', WebsiteRuleSchema);
