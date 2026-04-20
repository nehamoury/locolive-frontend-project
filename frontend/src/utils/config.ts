// Returns base URL without /api suffix — used for media/asset URLs
// API calls go through src/services/api.ts which handles the /api prefix
export const getBackendURL = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  return `http://${hostname}:8080`;
};

// BACKEND is used for constructing media/upload URLs (no /api prefix)
export const BACKEND = getBackendURL();