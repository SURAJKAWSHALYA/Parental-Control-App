import api from './api';

export interface Geofence {
  _id: string;
  childId: string;
  deviceId: string;
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enabled: boolean;
  enterAlert: boolean;
  exitAlert: boolean;
  createdAt: string;
  updatedAt: string;
}

export const geofenceService = {
  getGeofences: async (deviceId: string) => {
    const response = await api.get(`/geofences/${deviceId}`);
    return response.data.data;
  },

  createGeofence: async (deviceId: string, geofenceData: Partial<Geofence>) => {
    const response = await api.post(`/geofences/${deviceId}`, geofenceData);
    return response.data.data;
  },

  updateGeofence: async (deviceId: string, id: string, geofenceData: Partial<Geofence>) => {
    const response = await api.put(`/geofences/${deviceId}/${id}`, geofenceData);
    return response.data.data;
  },

  deleteGeofence: async (deviceId: string, id: string) => {
    const response = await api.delete(`/geofences/${deviceId}/${id}`);
    return response.data.data;
  }
};
