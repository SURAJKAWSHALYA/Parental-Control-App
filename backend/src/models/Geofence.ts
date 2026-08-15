import mongoose, { Schema, Document } from 'mongoose';

export interface IGeofence extends Document {
  childId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  placeId: mongoose.Types.ObjectId;
  name: string; // snapshot of place name
  latitude: number; // snapshot of place lat
  longitude: number; // snapshot of place lng
  radiusMeters: number; // snapshot of place radius
  enabled: boolean;
  enterAlert: boolean;
  exitAlert: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GeofenceSchema: Schema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    
    // We snapshot the Place data here so Android can simply fetch Geofences 
    // without needing to join with Places locally
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, required: true },

    enabled: { type: Boolean, default: true },
    enterAlert: { type: Boolean, default: true },
    exitAlert: { type: Boolean, default: true }
  },
  { timestamps: true }
);

GeofenceSchema.index({ deviceId: 1, placeId: 1 }, { unique: true }); // A device can only have one geofence configuration per place

export const Geofence = mongoose.model<IGeofence>('Geofence', GeofenceSchema);
