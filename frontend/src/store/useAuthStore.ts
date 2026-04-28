import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  role?: 'user' | 'admin' | 'moderator';
  provider?: string;
  is_profile_complete?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  requiresProfileCompletion: boolean;
  
  // Actions
  login: (token: string, user: User, requiresProfileCompletion?: boolean) => void;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
  setRequiresProfileCompletion: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      requiresProfileCompletion: false,

      login: (token, user, requiresProfileCompletion = false) =>
        set({
          token,
          user,
          isAuthenticated: true,
          requiresProfileCompletion,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requiresProfileCompletion: false,
        }),

      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),

      setRequiresProfileCompletion: (value) =>
        set({ requiresProfileCompletion: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        requiresProfileCompletion: state.requiresProfileCompletion,
      }),
    }
  )
);

export default useAuthStore;

