import apiService from './api';
import { 
  Task, 
  CreateTaskData, 
  TaskFilters,
  UpdateTaskPositionData,
  BulkUpdateTasksData,
  ApiResponse,
  PaginationResponse 
} from '../types';

export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationResponse;
}

class TaskService {
  async getTasks(params?: TaskFilters): Promise<TasksResponse> {
    return apiService.get<TasksResponse>('/tasks', params);
  }

  async getTask(id: string): Promise<{ task: Task }> {
    return apiService.get<{ task: Task }>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskData): Promise<ApiResponse<{ task: Task }>> {
    return apiService.post<ApiResponse<{ task: Task }>>('/tasks', data);
  }

  async updateTask(id: string, data: Partial<CreateTaskData>): Promise<ApiResponse<{ task: Task }>> {
    return apiService.put<ApiResponse<{ task: Task }>>(`/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return apiService.delete<ApiResponse>(`/tasks/${id}`);
  }

  async updateTaskPosition(id: string, data: UpdateTaskPositionData): Promise<ApiResponse> {
    return apiService.patch<ApiResponse>(`/tasks/${id}/position`, data);
  }

  async assignTask(id: string, assignee_id: string | null): Promise<ApiResponse<{ task: Task }>> {
    return apiService.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}/assign`, { assignee_id });
  }

  async bulkUpdateTasks(data: BulkUpdateTasksData): Promise<ApiResponse<{ tasks: Task[] }>> {
    return apiService.patch<ApiResponse<{ tasks: Task[] }>>('/tasks/bulk-update', data);
  }

  async getTasksByProject(projectId: string, filters?: Omit<TaskFilters, 'project_id'>): Promise<TasksResponse> {
    return this.getTasks({ ...filters, project_id: projectId });
  }
}

export const taskService = new TaskService();
export default taskService;