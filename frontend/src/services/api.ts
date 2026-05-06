import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

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

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const shouldSkipRefresh = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('/users/login') || url.includes('/users/renew-access') || url.includes('/logout');
};

const clearLocalSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('auth-storage');
};


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
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isForbidden = error.response?.status === 403;
    
    // ─── 403 FORBIDDEN: Handle unverified accounts ────────────────────────────
    if (isForbidden && (error.response?.data as any)?.error === 'account_not_verified') {
      const isVerifyPage = window.location.pathname.includes('/verify');
      if (!isVerifyPage) {
        window.location.href = '/verify';
      }
      return Promise.reject(error);
    }

    // ─── 401 UNAUTHORIZED: Trigger Silent Refresh ─────────────────────────────
    if (isUnauthorized && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          // Note: renew-access relies on HttpOnly cookies, so no token needs to be passed
          // But we send fallback from localStorage if cookie fails
          const fallbackRefresh = localStorage.getItem('refresh_token');
          const body = fallbackRefresh ? { refresh_token: fallbackRefresh } : undefined;
          refreshPromise = api.post('/users/renew-access', body).then(async (res) => {
            const data = res.data as any;
            if (data?.access_token) {
              const newToken = data.access_token;
              localStorage.setItem('token', newToken);
              
              // Store new refresh token as fallback (cookie is primary)
              if (data?.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
              }
              
              // Sync Zustand store if it exists
              try {
                const { useAuthStore } = await import('../store/useAuthStore');
                const store = useAuthStore.getState();
                if (store.user) {
                  store.login(newToken, store.user, store.requiresProfileCompletion);
                }
              } catch (e) {
                console.error('Failed to sync auth store after refresh', e);
              }
            }
          }).finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }

        if (refreshPromise) {
          await refreshPromise;
        }

        // Re-attach the new token to the headers of the original request
        const newToken = localStorage.getItem('token');
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.warn('Session expired. Clearing local state...');
        clearLocalSession();
        
        const isAuthPage = window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/signup');
        if (!isAuthPage) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
