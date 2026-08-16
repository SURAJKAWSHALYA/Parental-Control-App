import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  responseBody?: string;
  statusCode?: number;
  createdAt: Date;
}

const IdempotencyKeySchema: Schema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  responseBody: {
    type: String,
    required: false
  },
  statusCode: {
    type: Number,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL index: automatically expire after 24 hours
  }
});

export default mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
