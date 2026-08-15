import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  type: 'DIRECT' | 'FAMILY';
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    type: { type: String, enum: ['DIRECT', 'FAMILY'], default: 'DIRECT' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes to speed up queries
conversationSchema.index({ parentId: 1, childId: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
