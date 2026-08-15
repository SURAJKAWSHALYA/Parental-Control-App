import { Response } from 'express';
import { Place } from '../models/Place';
import { Geofence } from '../models/Geofence';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getPlaces = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const places = await Place.find({ parentId }).sort({ name: 1 });
    sendSuccess(res, places, 'Places fetched successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const createPlace = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { name, address, latitude, longitude, radiusMeters, icon } = req.body;

    if (radiusMeters < 50 || radiusMeters > 10000) {
      return sendError(res, 'Radius must be between 50 and 10000 meters', 'VALIDATION_ERROR', 400);
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return sendError(res, 'Invalid coordinates', 'VALIDATION_ERROR', 400);
    }

    const place = await Place.create({
      parentId,
      name,
      address,
      latitude,
      longitude,
      radiusMeters,
      icon: icon || 'MapPin'
    });

    sendSuccess(res, place, 'Place created successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const updatePlace = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;
    const { name, address, latitude, longitude, radiusMeters, icon } = req.body;

    const place = await Place.findOne({ _id: id, parentId });
    if (!place) return sendError(res, 'Place not found or access denied', 'NOT_FOUND', 404);

    if (radiusMeters && (radiusMeters < 50 || radiusMeters > 10000)) {
      return sendError(res, 'Radius must be between 50 and 10000 meters', 'VALIDATION_ERROR', 400);
    }

    place.name = name || place.name;
    place.address = address || place.address;
    place.latitude = latitude ?? place.latitude;
    place.longitude = longitude ?? place.longitude;
    place.radiusMeters = radiusMeters ?? place.radiusMeters;
    place.icon = icon || place.icon;

    await place.save();

    // Propagate updates to connected geofences so Android updates seamlessly
    await Geofence.updateMany(
      { placeId: place._id },
      {
        $set: {
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          radiusMeters: place.radiusMeters
        }
      }
    );

    sendSuccess(res, place, 'Place updated successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const deletePlace = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user._id;
    const { id } = req.params;

    const place = await Place.findOne({ _id: id, parentId });
    if (!place) return sendError(res, 'Place not found or access denied', 'NOT_FOUND', 404);

    await place.deleteOne();

    // Also delete associated geofences
    await Geofence.deleteMany({ placeId: place._id });

    sendSuccess(res, null, 'Place deleted successfully');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
