"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlace = exports.updatePlace = exports.createPlace = exports.getPlaces = void 0;
const Place_1 = require("../models/Place");
const Geofence_1 = require("../models/Geofence");
const response_1 = require("../utils/response");
const getPlaces = async (req, res) => {
    try {
        const parentId = req.user._id;
        const places = await Place_1.Place.find({ parentId }).sort({ name: 1 });
        (0, response_1.sendSuccess)(res, places, 'Places fetched successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.getPlaces = getPlaces;
const createPlace = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { name, address, latitude, longitude, radiusMeters, icon } = req.body;
        if (radiusMeters < 50 || radiusMeters > 10000) {
            return (0, response_1.sendError)(res, 'Radius must be between 50 and 10000 meters', 'VALIDATION_ERROR', 400);
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return (0, response_1.sendError)(res, 'Invalid coordinates', 'VALIDATION_ERROR', 400);
        }
        const place = await Place_1.Place.create({
            parentId,
            name,
            address,
            latitude,
            longitude,
            radiusMeters,
            icon: icon || 'MapPin'
        });
        (0, response_1.sendSuccess)(res, place, 'Place created successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.createPlace = createPlace;
const updatePlace = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const { name, address, latitude, longitude, radiusMeters, icon } = req.body;
        const place = await Place_1.Place.findOne({ _id: id, parentId });
        if (!place)
            return (0, response_1.sendError)(res, 'Place not found or access denied', 'NOT_FOUND', 404);
        if (radiusMeters && (radiusMeters < 50 || radiusMeters > 10000)) {
            return (0, response_1.sendError)(res, 'Radius must be between 50 and 10000 meters', 'VALIDATION_ERROR', 400);
        }
        place.name = name || place.name;
        place.address = address || place.address;
        place.latitude = latitude ?? place.latitude;
        place.longitude = longitude ?? place.longitude;
        place.radiusMeters = radiusMeters ?? place.radiusMeters;
        place.icon = icon || place.icon;
        await place.save();
        // Propagate updates to connected geofences so Android updates seamlessly
        await Geofence_1.Geofence.updateMany({ placeId: place._id }, {
            $set: {
                name: place.name,
                latitude: place.latitude,
                longitude: place.longitude,
                radiusMeters: place.radiusMeters
            }
        });
        (0, response_1.sendSuccess)(res, place, 'Place updated successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.updatePlace = updatePlace;
const deletePlace = async (req, res) => {
    try {
        const parentId = req.user._id;
        const { id } = req.params;
        const place = await Place_1.Place.findOne({ _id: id, parentId });
        if (!place)
            return (0, response_1.sendError)(res, 'Place not found or access denied', 'NOT_FOUND', 404);
        await place.deleteOne();
        // Also delete associated geofences
        await Geofence_1.Geofence.deleteMany({ placeId: place._id });
        (0, response_1.sendSuccess)(res, null, 'Place deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message);
    }
};
exports.deletePlace = deletePlace;
