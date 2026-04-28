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
  role?: 'user' | 'admin' | 'moderator';
  provider?: string;
  is_profile_complete?: boolean;
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

  // Sync Zustand store with localStorage
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // If no token, we're definitely not logged in
      if (!storedToken || !storedUser) {
        setTimeout(() => setLoading(false), 2000);
        return;
      }

      // If already in store, we might not need to verify every time on mount
      // but let's do a quiet check to ensure session is still valid
      if (authStore.isAuthenticated && authStore.user) {
        setTimeout(() => setLoading(false), 2000);
        return;
      }
      
      try {
        // Verify token by fetching user profile
        const response = await api.get('/profile/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        
        const user = response.data;
        authStore.login(storedToken, user, !user.is_profile_complete);
      } catch (err: any) {
        console.error('Token verification failed:', err);
        // Only logout if it's an auth error (401/403)
        // If it's a network error, keep the local state but maybe show a warning
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        // Minimum splash screen time for better UX/Branding
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    verifyToken();
  }, []);

  const handleLogin = (newToken: string, newUser: User, requiresProfileCompletion = false) => {
    authStore.login(newToken, newUser, requiresProfileCompletion);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    authStore.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    authStore.updateUser(userData);
    const currentUser = authStore.user;
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...userData }));
      // Also update Zustand persist (done automatically by Zustand)
    }
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

