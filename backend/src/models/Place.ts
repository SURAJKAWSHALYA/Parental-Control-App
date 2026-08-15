import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  parentId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema: Schema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
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
    radiusMeters: { 
      type: Number, 
      required: true,
      min: 50,
      max: 10000 // Sensible maximum for a geofence radius
    },
    icon: { type: String, default: 'MapPin' } // lucide icon string
  },
  { timestamps: true }
);

PlaceSchema.index({ parentId: 1 });

export const Place = mongoose.model<IPlace>('Place', PlaceSchema);
