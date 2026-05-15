import api from './api';

export const authService = {
  login: (credentials: any) => api.post('users/login', credentials),
  signup: (userData: any) => api.post('users', userData),
  startPreverify: (signup_session_id?: string) => api.post('auth/preverify/start', { signup_session_id }),
  sendEmailOTP: (signup_session_id: string, email: string) => api.post('auth/preverify/email/send', { signup_session_id, email }),
  verifyEmailOTP: (signup_session_id: string, otp: string) => api.post('auth/preverify/email/verify', { signup_session_id, otp }),
  sendPhoneOTP: (signup_session_id: string, phone: string, email_verification_token: string) =>
    api.post('auth/preverify/phone/send', { signup_session_id, phone, email_verification_token }),
  verifyPhoneOTP: (signup_session_id: string, otp: string, email_verification_token: string) =>
    api.post('auth/preverify/phone/verify', { signup_session_id, otp, email_verification_token }),
  verifyFirebasePhonePreverify: (signup_session_id: string, id_token: string, email_verification_token: string) =>
    api.post('auth/preverify/phone/verify-firebase', { signup_session_id, id_token, email_verification_token }),
  logout: () => api.post('auth/logout'),
  getCurrentUser: () => api.get('profile/me'),
  forgotPassword: (email: string) => api.post('auth/forgot-password', { email }),
  verifyResetToken: (token: string) => api.post('auth/verify-reset-token', { token }),
  resetPassword: (data: any) => api.post('auth/reset-password', data),
  completeProfile: (data: { username: string; phone: string }) => 
    api.post('users/complete-profile', data),
};

export default authService;

