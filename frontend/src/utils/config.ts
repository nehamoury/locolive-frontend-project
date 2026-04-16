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

export const BACKEND = getBackendURL();