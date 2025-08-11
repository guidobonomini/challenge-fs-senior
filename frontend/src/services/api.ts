import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = this.getErrorMessage(error);
        
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
          toast.error('Session expired. Please login again.');
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (message && !this.isValidationError(error)) {
          toast.error(message);
        }

        return Promise.reject(error);
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.error || data.message || 'An error occurred';
    }
    return error.message || 'Network error';
  }

  private isValidationError(error: AxiosError): boolean {
    return error.response?.status === 400 && 
           (error.response.data as any)?.details;
  }

  // Generic methods
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    return response.data;
  }

  // Auth token management
  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  // Axios instance getter for custom requests
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService;