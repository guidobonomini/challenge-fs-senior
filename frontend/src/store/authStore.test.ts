import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';
import { authService } from '../services/auth';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('../services/auth');
jest.mock('react-hot-toast');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset store state
    useAuthStore.getState().user = null;
    useAuthStore.getState().token = null;
    useAuthStore.getState().isAuthenticated = false;
    useAuthStore.getState().isLoading = false;
    useAuthStore.getState().error = null;
    useAuthStore.getState().isInitialized = false;
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'member' as const,
        is_active: true,
        email_verified: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        message: 'Login successful',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockToast.success).toHaveBeenCalledWith('Welcome back!');
    });

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid credentials',
          },
        },
      };

      mockAuthService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthService.login.mockReturnValue(loginPromise as any);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveLogin!({
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          message: 'Login successful',
        });
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'member' as const,
        is_active: true,
        email_verified: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        user: mockUser,
        token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        message: 'User registered successfully',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('mock-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith('Account created successfully!');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial state
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.user = {
          id: '1',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'member',
          is_active: true,
          email_verified: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };
        result.current.token = 'mock-token';
        result.current.isAuthenticated = true;
      });

      mockAuthService.logout.mockResolvedValue();

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockToast.success).toHaveBeenCalledWith('Logged out successfully');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set error
      act(() => {
        result.current.error = 'Some error';
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});