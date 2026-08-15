import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  clientMessageId?: string; // used for duplicate prevention
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'Parent' | 'Child';
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM' | 'SAFETY_ALERT';
  text: string;
  mediaId?: mongoose.Types.ObjectId;
  replyToMessageId?: mongoose.Types.ObjectId;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  safetyStatus: 'SAFE' | 'REVIEW' | 'FLAGGED' | 'UNKNOWN';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    clientMessageId: { type: String, index: true }, // Optional but good for dedup
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['Parent', 'Child'], required: true },
    messageType: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'SYSTEM', 'SAFETY_ALERT'], default: 'TEXT' },
    text: { type: String, required: true, maxlength: 5000 },
    mediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    replyToMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    status: { type: String, enum: ['SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'SENT' },
    safetyStatus: { type: String, enum: ['SAFE', 'REVIEW', 'FLAGGED', 'UNKNOWN'], default: 'UNKNOWN' },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ text: 'text' });
messageSchema.index({ conversationId: 1, senderType: 1, safetyStatus: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
