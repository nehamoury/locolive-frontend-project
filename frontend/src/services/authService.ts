import api from './api';

export const authService = {
  login: (credentials: any) => api.post('users/login', credentials),
  signup: (userData: any) => api.post('users', userData),
  logout: () => api.post('auth/logout'),
  getCurrentUser: () => api.get('profile/me'),
  forgotPassword: (email: string) => api.post('auth/forgot-password', { email }),
  verifyResetToken: (token: string) => api.post('auth/verify-reset-token', { token }),
  resetPassword: (data: any) => api.post('auth/reset-password', data),
  completeProfile: (data: { username: string; phone: string }) => 
    api.post('users/complete-profile', data),
};

export default authService;

