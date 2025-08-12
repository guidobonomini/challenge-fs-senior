import api from './api';

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_system: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface AISuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  reasoning: string;
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  primary_suggestion: AISuggestion | null;
  keywords_detected: string[];
  analysis_timestamp: string;
  model_version: string;
}

export interface CategorizationStats {
  total_tasks: number;
  categorized_tasks: number;
  ai_categorized_tasks: number;
  manual_categorized_tasks: number;
  pending_suggestions: number;
  category_distribution: Array<{
    category_name: string;
    count: number;
    percentage: number;
  }>;
}

export interface TaskWithSuggestions {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  due_date?: string;
  ai_suggestions: AISuggestion[];
  created_at: string;
  project_name: string;
  project_color: string;
}

export interface PaginatedTasksWithSuggestions {
  tasks: TaskWithSuggestions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AICategorizationService {
  // Category management
  async getCategories(): Promise<TaskCategory[]> {
    const response = await api.get<{ categories: TaskCategory[] }>('/ai/categories');
    return response.categories;
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
  }): Promise<TaskCategory> {
    const response = await api.post<{ category: TaskCategory }>('/ai/categories', categoryData);
    return response.category;
  }

  async updateCategory(
    categoryId: string, 
    updates: Partial<TaskCategory>
  ): Promise<TaskCategory> {
    const response = await api.put<{ category: TaskCategory }>(`/ai/categories/${categoryId}`, updates);
    return response.category;
  }

  // Task analysis and categorization
  async analyzeTask(taskId: string): Promise<{
    analysis: AIAnalysisResult;
    task: {
      id: string;
      title: string;
      description?: string;
      current_category_id?: string;
    };
  }> {
    const response = await api.get<{
      analysis: AIAnalysisResult;
      task: {
        id: string;
        title: string;
        description?: string;
        current_category_id?: string;
      };
    }>(`/ai/tasks/${taskId}/analyze`);
    return response;
  }

  async categorizeTask(
    taskId: string, 
    acceptSuggestion: boolean = true
  ): Promise<{
    analysis: AIAnalysisResult;
    categorized: boolean;
    message: string;
  }> {
    const response = await api.post<{
      analysis: AIAnalysisResult;
      categorized: boolean;
      message: string;
    }>(`/ai/tasks/${taskId}/categorize`, {
      accept_suggestion: acceptSuggestion
    });
    return response;
  }

  async acceptSuggestion(
    taskId: string, 
    categoryId: string, 
    feedback?: string
  ): Promise<void> {
    await api.post<void>(`/ai/tasks/${taskId}/accept-suggestion`, {
      category_id: categoryId,
      feedback
    });
  }

  async rejectSuggestion(
    taskId: string, 
    categoryId: string, 
    feedback?: string
  ): Promise<void> {
    await api.post<void>(`/ai/tasks/${taskId}/reject-suggestion`, {
      category_id: categoryId,
      feedback
    });
  }

  async manualCategorization(
    taskId: string, 
    categoryId: string | null
  ): Promise<void> {
    await api.put<void>(`/ai/tasks/${taskId}/category`, {
      category_id: categoryId
    });
  }

  // Bulk operations
  async bulkCategorizeProject(
    projectId: string, 
    acceptSuggestion: boolean = true
  ): Promise<{
    processed: number;
    categorized: number;
    message: string;
  }> {
    console.log('Calling bulk categorization API for project:', projectId);
    
    const response = await api.post<{
      processed: number;
      categorized: number;
      message: string;
    }>(`/ai/projects/${projectId}/bulk-categorize`, {
      accept_suggestion: acceptSuggestion
    }, {
      timeout: 300000 // 5 minutes timeout for bulk operations
    });
    
    console.log('API response received:', response);
    return response;
  }

  // Analytics and reporting
  async getCategorizationStats(projectId?: string): Promise<CategorizationStats> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.get<{ stats: CategorizationStats }>('/ai/stats', params);
    return response.stats;
  }

  async getTasksWithSuggestions(params: {
    page?: number;
    limit?: number;
    project_id?: string;
  } = {}): Promise<PaginatedTasksWithSuggestions> {
    const response = await api.get<PaginatedTasksWithSuggestions>('/ai/tasks/pending-suggestions', params);
    return response;
  }

  // Helper methods
  getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      'Bug Fix': '#ef4444',
      'Feature Development': '#3b82f6',
      'Documentation': '#8b5cf6',
      'Testing': '#10b981',
      'Research': '#f59e0b',
      'Maintenance': '#6b7280',
      'UI/UX': '#ec4899',
      'Performance': '#f97316'
    };
    return colorMap[categoryName] || '#6b7280';
  }

  getCategoryIcon(categoryName: string): string {
    const iconMap: Record<string, string> = {
      'Bug Fix': 'bug-ant',
      'Feature Development': 'sparkles',
      'Documentation': 'document-text',
      'Testing': 'beaker',
      'Research': 'magnifying-glass',
      'Maintenance': 'wrench-screwdriver',
      'UI/UX': 'paint-brush',
      'Performance': 'rocket-launch'
    };
    return iconMap[categoryName] || 'tag';
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Medium';
    if (confidence >= 0.2) return 'Low';
    return 'Very Low';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100';
    if (confidence >= 0.2) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }
}

export const aiCategorizationService = new AICategorizationService();
export default aiCategorizationService;