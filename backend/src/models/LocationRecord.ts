import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationRecord extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  battery?: number;
  source: string;
  timestamp: Date;
  createdAt: Date;
}

const LocationRecordSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    latitude: { 
      type: Number, 
      required: true,
      min: -90,
      max: 90
    },
    longitude: { 
      type: Number, 
      required: true,
      min: -180,
      max: 180
    },
    accuracy: { type: Number, required: true },
    altitude: { type: Number },
    speed: { type: Number },
    heading: { type: Number },
    battery: { type: Number },
    source: { type: String, default: 'fused' }, // e.g., gps, network, fused
    timestamp: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for fast history querying
LocationRecordSchema.index({ deviceId: 1, timestamp: -1 });
LocationRecordSchema.index({ childId: 1, timestamp: -1 });

export const LocationRecord = mongoose.model<ILocationRecord>('LocationRecord', LocationRecordSchema);
