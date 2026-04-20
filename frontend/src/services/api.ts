import axios from 'axios';

// ─── Single Source of Truth ───────────────────────────────────────────────────
// VITE_API_URL must be the base host WITHOUT /api, e.g. http://localhost:8081
// All API calls go through this axios instance which adds /api automatically.

const RAW_URL = import.meta.env.VITE_API_URL as string | undefined;

// Strip any trailing /api or /api/ that may have been set accidentally
const BASE_HOST = (RAW_URL ?? 'http://localhost:8081').replace(/\/api\/?$/, '').replace(/\/$/, '');

// The axios baseURL — always ends with /api (no trailing slash)
export const API_BASE_URL = `${BASE_HOST}/api`;

// The host-only URL — used for media/upload file construction and WebSocket
export const HOST_URL = BASE_HOST;

// WebSocket base — ws:// for http, wss:// for https
export const WS_BASE_URL = BASE_HOST
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://');

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT + handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 + unwrap { success, data } envelope
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return { ...response, data: response.data.data };
      }
      return Promise.reject({
        response: {
          ...response,
          data: { error: response.data.error || 'Unknown error' },
        },
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Global 401 caught. Clearing session...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
