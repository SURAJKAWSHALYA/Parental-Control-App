import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the user is unauthorized (token expired, etc)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Force login page
    }
    
    // In production, suppress detailed stack traces in UI
    if (error.response?.status >= 500) {
      console.error('API Error:', error.response.data); // Log for console debugging only
    }

    return Promise.reject(error);
  }
);

export default api;
