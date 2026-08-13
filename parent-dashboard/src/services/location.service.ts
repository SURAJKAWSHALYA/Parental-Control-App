import api from './api';

export interface LocationRecord {
  _id: string;
  childId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  battery?: number;
  source: string;
  timestamp: string;
}

export const locationService = {
  getCurrentLocation: async (deviceId: string) => {
    const response = await api.get(`/location/${deviceId}/current`);
    return response.data.data;
  },

  getLocationHistory: async (deviceId: string, params: { startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const response = await api.get(`/location/${deviceId}/history`, { params });
    return response.data.data;
  },

  deleteLocationHistory: async (deviceId: string, params: { startDate?: string; endDate?: string }) => {
    const response = await api.delete(`/location/${deviceId}/history`, { data: params });
    return response.data.data;
  }
};
