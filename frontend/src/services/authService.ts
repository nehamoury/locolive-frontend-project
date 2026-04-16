import api from './api';

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (userData: any) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (token: string) => api.post('/auth/verify-reset-token', { token }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export default authService;
