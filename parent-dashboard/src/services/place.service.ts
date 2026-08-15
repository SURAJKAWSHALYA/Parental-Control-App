import api from './api';

export interface Place {
  _id: string;
  parentId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const placeService = {
  getPlaces: async () => {
    const response = await api.get('/places');
    return response.data.data;
  },

  createPlace: async (placeData: Partial<Place>) => {
    const response = await api.post('/places', placeData);
    return response.data.data;
  },

  updatePlace: async (id: string, placeData: Partial<Place>) => {
    const response = await api.put(`/places/${id}`, placeData);
    return response.data.data;
  },

  deletePlace: async (id: string) => {
    const response = await api.delete(`/places/${id}`);
    return response.data.data;
  }
};
