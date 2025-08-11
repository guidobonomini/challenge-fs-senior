import apiService from './api';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse 
} from '../types';

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  message: string;
}

export interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.token) {
      apiService.setAuthToken(response.token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    if (response.token) {
      apiService.setAuthToken(response.token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      this.clearLocalStorage();
    }
  }

  async refreshToken(): Promise<{ token: string; refresh_token: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<{ token: string; refresh_token: string }>('/auth/refresh-token', {
      refresh_token: refreshToken,
    });

    apiService.setAuthToken(response.token);
    localStorage.setItem('refreshToken', response.refresh_token);

    return response;
  }

  async getProfile(): Promise<{ user: User }> {
    return apiService.get<{ user: User }>('/auth/profile');
  }

  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<{ user: User }>> {
    const response = await apiService.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    
    if (response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    return apiService.put<ApiResponse>('/auth/change-password', data);
  }

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    return apiService.post<ApiResponse>('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return apiService.post<ApiResponse>('/auth/reset-password', data);
  }

  // Local storage management
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return apiService.getAuthToken();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  clearLocalStorage(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    apiService.removeAuthToken();
  }

  // Token validation
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        this.clearLocalStorage();
        return false;
      }
    }

    try {
      await this.getProfile();
      return true;
    } catch (error) {
      this.clearLocalStorage();
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;