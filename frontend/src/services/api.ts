import axios from 'axios';

// ─── Single Source of Truth ───────────────────────────────────────────────────
// VITE_API_URL must be the base host WITHOUT /api, e.g. http://localhost:8081
// All API calls go through this axios instance which adds /api automatically.

const RAW_URL = import.meta.env.VITE_API_URL as string | undefined;

// If the URL is a local IP, and we are not on localhost, it's likely a leftover from dev
const isLocalIP = (url: string) => /192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url) || url.includes('localhost') || url.includes('127.0.0.1');

// Fallback logic: 
// 1. If VITE_API_URL is set (during build) and NOT a local IP (for prod safety), use it.
// 2. If running on localhost or a local dev port, use the local backend port (8080).
// 3. Otherwise (Production), use the current browser origin.
const FALLBACK_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.port === '5173' || 
   window.location.port === '5174' ||
   isLocalIP(window.location.hostname))
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : (typeof window !== 'undefined' ? window.location.origin : '');

const FINAL_URL = (RAW_URL && !isLocalIP(RAW_URL)) 
  ? RAW_URL 
  : FALLBACK_URL;

const BASE_HOST = FINAL_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

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
  withCredentials: true, // Crucial for sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT fallback from localStorage (if any)
api.interceptors.request.use(
  (config) => {
    // Browsers send HttpOnly cookies automatically, but we keep this for 
    // environments where cookies might not be supported or for the transition period.
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
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
      localStorage.removeItem('auth-storage');
      
      // If we're not already on the login page, redirect to it
      const isAuthPage = window.location.pathname.includes('/login') || 
                        window.location.pathname.includes('/signup') ||
                        window.location.pathname.includes('/forgot-password');
                        
      if (!isAuthPage) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
