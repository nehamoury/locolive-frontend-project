import axios from 'axios';

const getApiBaseURL = () => {
  // First check if VITE_API_URL environment variable is set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback: detect based on hostname for development
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const baseURL = isLocalhost ? 'http://localhost:8080' : `http://${hostname}:8080`;
  return baseURL;
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If the data is FormData, remove Content-Type so the browser 
    // sets it automatically with the correct multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized and unwrap standardized responses
api.interceptors.response.use(
  (response) => {
    // If the response follows our standard { success: true, data: ... } format, unwrap it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return { ...response, data: response.data.data };
      }
      // If success is false, we can reject it here or handle it in the error block
      return Promise.reject({
        response: {
          ...response,
          data: { error: response.data.error || 'Unknown error' }
        }
      });
    }
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      console.warn('Global 401 caught. Clearing session...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already on an auth page
      if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
