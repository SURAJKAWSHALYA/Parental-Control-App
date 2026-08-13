import mongoose, { Document, Schema } from 'mongoose';

export interface IChild extends Document {
  parentId: mongoose.Types.ObjectId;
  name: string;
  dateOfBirth: Date;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const childSchema = new Schema<IChild>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Child = mongoose.model<IChild>('Child', childSchema);
