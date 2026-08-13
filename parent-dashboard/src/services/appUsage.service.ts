import axios from 'axios';

const API_URL = '/api/app-usage';

export interface AppUsage {
  _id: string;
  deviceId: string;
  packageName: string;
  appName: string;
  usageDate: string;
  usageDuration: number;
  launchCount: number;
}

const getTodayUsage = async (deviceId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/${deviceId}/today`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

const getUsageHistory = async (deviceId: string, days: number = 7) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/${deviceId}/history?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const appUsageService = {
  getTodayUsage,
  getUsageHistory
};
