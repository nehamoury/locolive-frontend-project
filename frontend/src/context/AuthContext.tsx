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
      
      // If no token, we're definitely not logged in
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // If already in store, we might not need to verify every time on mount
      if (authStore.isAuthenticated && authStore.user) {
        setLoading(false);
        return;
      }
      
      try {
        // Verify token by fetching user profile
        // The interceptor will handle 401 automatically by trying a refresh
        const response = await api.get('/profile/me');
        
        const user = response.data;
        authStore.login(storedToken, user, !user.is_profile_complete);
      } catch (err: unknown) {
        console.error('Token verification failed:', err);
        // Note: The api interceptor will have already attempted refresh.
        // If we get here, it means the session is truly dead.
        authStore.logout();
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run on mount

  const handleLogin = (newToken: string, newUser: User, requiresProfileCompletion = false) => {
    authStore.login(newToken, newUser, requiresProfileCompletion);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    authStore.logout();
    localStorage.removeItem('token');
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

