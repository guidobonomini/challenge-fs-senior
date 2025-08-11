import apiService from './api';
import { 
  Project, 
  CreateProjectData, 
  ProjectFilters,
  ApiResponse,
  PaginationResponse 
} from '../types';

export interface ProjectsResponse {
  projects: Project[];
  pagination: PaginationResponse;
}

class ProjectService {
  async getProjects(params?: ProjectFilters): Promise<ProjectsResponse> {
    return apiService.get<ProjectsResponse>('/projects', params);
  }

  async getProject(id: string): Promise<{ project: Project }> {
    return apiService.get<{ project: Project }>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectData): Promise<ApiResponse<{ project: Project }>> {
    return apiService.post<ApiResponse<{ project: Project }>>('/projects', data);
  }

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<ApiResponse<{ project: Project }>> {
    return apiService.put<ApiResponse<{ project: Project }>>(`/projects/${id}`, data);
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return apiService.delete<ApiResponse>(`/projects/${id}`);
  }

  async getProjectMembers(id: string): Promise<{ members: any[] }> {
    return apiService.get<{ members: any[] }>(`/projects/${id}/members`);
  }

  async updateProjectProgress(id: string, progress: number): Promise<ApiResponse<{ project: Project }>> {
    return apiService.patch<ApiResponse<{ project: Project }>>(`/projects/${id}/progress`, { progress });
  }
}

export const projectService = new ProjectService();
export default projectService;