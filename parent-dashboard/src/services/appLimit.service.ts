import axios from 'axios';

const API_URL = '/api/app-limits';

export interface AppLimit {
  _id: string;
  deviceId: string;
  packageName: string;
  appName: string;
  dailyLimitMinutes: number;
  enabled: boolean;
}

const getLimits = async (deviceId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/${deviceId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const setLimit = async (data: { deviceId: string, packageName: string, appName?: string, dailyLimitMinutes: number, enabled?: boolean }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const updateLimit = async (id: string, data: { dailyLimitMinutes?: number, enabled?: boolean }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const deleteLimit = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const appLimitService = {
  getLimits,
  setLimit,
  updateLimit,
  deleteLimit
};
