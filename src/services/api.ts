import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Создаём axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor для добавления токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - удаляем токен и редиректим на логин
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ============================================
// LOGS API
// ============================================
export const logsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    source?: string;
    search?: string;
  }) => {
    const response = await api.get('/logs', { params });
    // API может возвращать как массив, так и объект с полем logs
    const data = response.data;
    return Array.isArray(data) ? data : (data.logs || data.data || []);
  },

  getOne: async (id: string) => {
    const response = await api.get(`/logs/${id}`);
    return response.data;
  },

  create: async (data: {
    source: string;
    severity: string;
    message: string;
    ip: string;
    action: string;
    user?: string;
    details?: Record<string, any>;
  }) => {
    const response = await api.post('/logs', data);
    return response.data;
  },

  getSources: async () => {
    const response = await api.get('/logs/sources');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/logs/stats');
    return response.data;
  },
};

// ============================================
// INCIDENTS API
// ============================================
export const incidentsApi = {
  getAll: async (params?: {
    status?: string;
    severity?: string;
  }) => {
    const response = await api.get('/incidents', { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.incidents || data.data || []);
  },

  getOne: async (id: string) => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    severity: string;
    affectedSystems: string[];
    description: string;
    assignedTo?: string;
    tags?: string[];
  }) => {
    const response = await api.post('/incidents', data);
    return response.data;
  },

  update: async (id: string, data: {
    status?: string;
    assignedTo?: string;
    description?: string;
    tags?: string[];
    affectedSystems?: string[];
  }) => {
    const response = await api.patch(`/incidents/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/incidents/stats');
    return response.data;
  },
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsApi = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getTimeSeries: async (hours: number = 24) => {
    const response = await api.get('/analytics/time-series', {
      params: { hours },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  },

  getSources: async () => {
    const response = await api.get('/analytics/sources');
    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  },

  getSeverity: async () => {
    const response = await api.get('/analytics/severity');
    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  },

  getTopIPs: async (limit: number = 10) => {
    const response = await api.get('/analytics/top-ips', {
      params: { limit },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data.data || []);
  },
};

// ============================================
// ALERTS API
// ============================================
export const alertsApi = {
  getAll: async () => {
    const response = await api.get('/alerts');
    const data = response.data;
    return Array.isArray(data) ? data : (data.alerts || data.data || []);
  },

  getOne: async (id: string) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/alerts', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/alerts/${id}`, data);
    return response.data;
  },

  toggle: async (id: string) => {
    const response = await api.patch(`/alerts/${id}/toggle`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  },
};

// ============================================
// AUTH API
// ============================================
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
};

export default api;