import apiService from './api';
import { 
  Team, 
  CreateTeamData, 
  ApiResponse,
  PaginationResponse 
} from '../types';

export interface TeamsResponse {
  teams: Team[];
  pagination: PaginationResponse;
}

class TeamService {
  async getTeams(page = 1, limit = 20): Promise<TeamsResponse> {
    return apiService.get<TeamsResponse>('/teams', { page, limit });
  }

  async getTeam(id: string): Promise<{ team: Team }> {
    return apiService.get<{ team: Team }>(`/teams/${id}`);
  }

  async createTeam(data: CreateTeamData): Promise<ApiResponse<{ team: Team }>> {
    return apiService.post<ApiResponse<{ team: Team }>>('/teams', data);
  }

  async updateTeam(id: string, data: Partial<CreateTeamData>): Promise<ApiResponse<{ team: Team }>> {
    return apiService.put<ApiResponse<{ team: Team }>>(`/teams/${id}`, data);
  }

  async deleteTeam(id: string): Promise<ApiResponse> {
    return apiService.delete<ApiResponse>(`/teams/${id}`);
  }

  async addTeamMember(id: string, email: string, role = 'member'): Promise<ApiResponse> {
    return apiService.post<ApiResponse>(`/teams/${id}/members`, { email, role });
  }

  async updateTeamMember(id: string, memberId: string, role: string): Promise<ApiResponse> {
    return apiService.put<ApiResponse>(`/teams/${id}/members/${memberId}`, { role });
  }

  async removeTeamMember(id: string, memberId: string): Promise<ApiResponse> {
    return apiService.delete<ApiResponse>(`/teams/${id}/members/${memberId}`);
  }

  async leaveTeam(id: string): Promise<ApiResponse> {
    return apiService.post<ApiResponse>(`/teams/${id}/leave`);
  }
}

export const teamService = new TeamService();
export default teamService;