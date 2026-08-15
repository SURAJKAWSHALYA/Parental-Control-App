import mongoose, { Document, Schema } from 'mongoose';

export interface IParent extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  familyId?: mongoose.Types.ObjectId; // If missing, this parent is the OWNER
  role: 'OWNER' | 'CO_PARENT';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const parentSchema = new Schema<IParent>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    familyId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent'
    },
    role: {
      type: String,
      enum: ['OWNER', 'CO_PARENT'],
      default: 'OWNER'
    },
    permissions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

export const Parent = mongoose.model<IParent>('Parent', parentSchema);
