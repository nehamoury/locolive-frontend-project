import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  connections_count?: number;
  is_ghost_mode?: boolean;
  is_private?: boolean;
  panic_mode?: boolean;
  saved_count?: number;
  role?: 'user' | 'admin' | 'moderator';
  provider?: string;
  is_profile_complete?: boolean;
  is_active?: boolean;
  is_email_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, requiresProfileCompletion?: boolean) => void;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
  loading: boolean;
  requiresProfileCompletion: boolean;
  setRequiresProfileCompletion: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const authStore = useAuthStore();

  // Sync Zustand store with backend on app load (bootstrap verification)
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Always verify token with the backend to prevent session bypass/stale cache
        const response = await api.get('/profile/me');
        const user = response.data;
        authStore.login('cookies_active', user, !user.is_profile_complete);
      } catch (err: unknown) {
        console.error('Auth verification failed on app load:', err);
        authStore.logout();
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run on mount

  const handleLogin = (_newToken: string, newUser: User, requiresProfileCompletion = false) => {
    authStore.login('cookies_active', newUser, requiresProfileCompletion);
  };

  const handleLogout = () => {
    authStore.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-storage');
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    authStore.updateUser(userData);
    // Zustand persist handles storage automatically
  };

  return (
    <AuthContext.Provider value={{ 
      user: authStore.user, 
      token: authStore.token,
      login: handleLogin,
      logout: handleLogout,
      updateUser: handleUpdateUser,
      loading,
      requiresProfileCompletion: authStore.requiresProfileCompletion,
      setRequiresProfileCompletion: authStore.setRequiresProfileCompletion,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

