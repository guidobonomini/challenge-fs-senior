import { apiService } from './api';
import { Category } from '../types';

export interface CategoriesResponse {
  categories: Category[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const categoryService = {
  // Get all categories
  getCategories: async (params?: { page?: number; limit?: number }): Promise<CategoriesResponse> => {
    const response = await apiService.get<CategoriesResponse>('/categories', params);
    return response;
  },

  // Get a single category
  getCategory: async (id: string): Promise<{ category: Category }> => {
    const response = await apiService.get<{ category: Category }>(`/categories/${id}`);
    return response;
  },

  // Create a new category
  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<{ category: Category; message: string }> => {
    const response = await apiService.post<{ category: Category; message: string }>('/categories', data);
    return response;
  },

  // Update a category
  updateCategory: async (id: string, data: {
    name?: string;
    description?: string;
    color?: string;
  }): Promise<{ category: Category; message: string }> => {
    const response = await apiService.put<{ category: Category; message: string }>(`/categories/${id}`, data);
    return response;
  },

  // Delete a category
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await apiService.delete<{ message: string }>(`/categories/${id}`);
    return response;
  },
};