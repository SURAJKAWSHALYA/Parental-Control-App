import api from './api';

export interface WebsiteRule {
  _id: string;
  childId: string;
  deviceId: string;
  type: 'BLOCK' | 'ALLOW';
  domain: string;
  category?: string;
  enabled: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteCategoryRule {
  _id: string;
  childId: string;
  deviceId: string;
  category: string;
  blocked: boolean;
  enabled: boolean;
}

export const websiteService = {
  getRules: async (deviceId: string) => {
    const response = await api.get(`/websites/${deviceId}/rules`);
    return response.data.data;
  },

  createRule: async (deviceId: string, rule: Partial<WebsiteRule>) => {
    const response = await api.post(`/websites/${deviceId}/rules`, rule);
    return response.data.data;
  },

  updateRule: async (deviceId: string, id: string, updates: Partial<WebsiteRule>) => {
    const response = await api.put(`/websites/${deviceId}/rules/${id}`, updates);
    return response.data.data;
  },

  deleteRule: async (deviceId: string, id: string) => {
    const response = await api.delete(`/websites/${deviceId}/rules/${id}`);
    return response.data;
  },

  getAvailableCategories: async () => {
    const response = await api.get('/websites/categories/available');
    return response.data.data;
  },

  getCategories: async (deviceId: string) => {
    const response = await api.get(`/websites/${deviceId}/categories`);
    return response.data.data;
  },

  updateCategory: async (deviceId: string, category: string, blocked: boolean, enabled: boolean = true) => {
    const response = await api.put(`/websites/${deviceId}/categories/${category}`, { blocked, enabled });
    return response.data.data;
  }
};
