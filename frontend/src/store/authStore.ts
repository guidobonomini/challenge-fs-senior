import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/auth';
import { toast } from 'react-hot-toast';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          
          // Set token in localStorage for API service
          localStorage.setItem('token', response.token);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success('Welcome back!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          
          // Set token in localStorage for API service
          localStorage.setItem('token', response.token);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success('Account created successfully!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          toast.success('Logged out successfully');
        }
      },

      refreshAuth: async () => {
        const currentToken = get().token;
        if (!currentToken) return;

        try {
          const response = await authService.refreshToken();
          
          // Set token in localStorage for API service
          localStorage.setItem('token', response.token);
          
          set({
            token: response.token,
            error: null,
          });
        } catch (error: any) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updateProfile(data as any);
          
          set((state) => ({
            user: response.user ? { ...state.user!, ...response.user } : state.user,
            isLoading: false,
            error: null,
          }));

          toast.success('Profile updated successfully');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Profile update failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
          const isAuthenticated = await authService.checkAuthStatus();
          
          if (isAuthenticated) {
            const profileResponse = await authService.getProfile();
            const token = authService.getToken();
            
            // Ensure token is in localStorage for API service
            if (token) {
              localStorage.setItem('token', token);
            }
            
            set({
              user: profileResponse.user,
              token: token,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          }
        } catch (error: any) {
          console.error('Auth initialization failed:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);