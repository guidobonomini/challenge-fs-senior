import { create } from 'zustand';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'admin' | 'manager' | 'member';
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
  member_count?: number;
  project_count?: number;
  member_role?: 'admin' | 'manager' | 'member' | null;
  _optimistic?: boolean;
}

interface CreateTeamData {
  name: string;
  description?: string;
}

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  currentTeamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  fetchTeams: (params?: any) => Promise<void>;
  fetchTeam: (id: string) => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
  createTeam: (data: CreateTeamData) => Promise<string>;
  updateTeam: (id: string, data: Partial<CreateTeamData>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string, role?: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: string) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  currentTeamMembers: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  fetchTeams: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<any>('/teams', params);
      set({
        teams: response.teams || [],
        pagination: response.pagination || get().pagination,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch teams';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTeam: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<any>(`/teams/${id}`);
      set({
        currentTeam: response.team || null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch team';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchTeamMembers: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<any>(`/teams/${teamId}/members`);
      set({
        currentTeamMembers: response.members || [],
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch team members';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createTeam: async (data: CreateTeamData) => {
    // Optimistic update: Create temporary team immediately
    const optimisticTeam = {
      id: `temp-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      owner_id: '', // Will be set by backend
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: true,
    } as Team;

    // Add optimistic team to state immediately
    set((state) => ({
      teams: [optimisticTeam, ...state.teams],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.post<any>('/teams', data);
      const createdTeam = response.team;
      
      if (!createdTeam || !createdTeam.id) {
        throw new Error('Invalid response: missing team ID');
      }
      
      // Replace optimistic team with real one
      set((state) => ({
        teams: state.teams.map(team => 
          team.id === optimisticTeam.id
            ? { ...createdTeam, _optimistic: false }
            : team
        ),
        isLoading: false,
      }));
      
      toast.success('Team created successfully');
      return createdTeam.id;
    } catch (error: any) {
      // Remove optimistic team on error
      set((state) => ({
        teams: state.teams.filter(team => team.id !== optimisticTeam.id),
        error: error.response?.data?.error || 'Failed to create team',
        isLoading: false,
      }));
      toast.error('Failed to create team');
      throw error;
    }
  },

  updateTeam: async (id: string, data: Partial<CreateTeamData>) => {
    // Store original team state for potential rollback
    const originalState = get();
    const originalTeam = originalState.teams.find(team => team.id === id);
    
    if (!originalTeam) {
      const errorMessage = 'Team not found in local state';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Optimistic update: Update team immediately
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === id ? { ...t, ...data, updated_at: new Date().toISOString(), _optimistic: true } : t
      ),
      currentTeam: state.currentTeam?.id === id 
        ? { ...state.currentTeam, ...data, updated_at: new Date().toISOString(), _optimistic: true }
        : state.currentTeam,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.put<any>(`/teams/${id}`, data);
      
      if (!response || !response.team) {
        throw new Error('Invalid server response: missing team data');
      }
      
      // Replace optimistic update with server response
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === id ? { ...originalTeam, ...response.team, _optimistic: false } : t
        ),
        currentTeam: state.currentTeam?.id === id
          ? { ...originalTeam, ...response.team, _optimistic: false }
          : state.currentTeam,
        isLoading: false,
      }));
      
      toast.success('Team updated successfully');
    } catch (error: any) {
      console.error('Team update error:', error);
      
      // Rollback optimistic update on error
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === id ? { ...originalTeam, _optimistic: false } : t
        ),
        currentTeam: state.currentTeam?.id === id
          ? { ...originalTeam, _optimistic: false }
          : state.currentTeam,
        error: error.response?.data?.error || error.message || 'Failed to update team',
        isLoading: false,
      }));
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update team';
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteTeam: async (id: string) => {
    // Store original team for potential rollback
    const originalState = get();
    const teamToDelete = originalState.teams.find(team => team.id === id);
    
    if (!teamToDelete) {
      throw new Error('Team not found');
    }

    // Optimistic update: Remove team immediately
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
      currentTeam: state.currentTeam?.id === id ? null : state.currentTeam,
      isLoading: true,
      error: null,
    }));

    try {
      await apiService.delete(`/teams/${id}`);
      
      // Confirm deletion (team already removed)
      set({ isLoading: false });
      toast.success('Team deleted successfully');
    } catch (error: any) {
      // Rollback: Restore deleted team
      const teamIndex = originalState.teams.findIndex(team => team.id === id);
      set((state) => ({
        teams: [
          ...state.teams.slice(0, teamIndex >= 0 ? teamIndex : state.teams.length),
          { ...teamToDelete, _optimistic: false },
          ...state.teams.slice(teamIndex >= 0 ? teamIndex : state.teams.length),
        ],
        currentTeam: originalState.currentTeam?.id === id ? originalState.currentTeam : state.currentTeam,
        error: error.response?.data?.error || 'Failed to delete team',
        isLoading: false,
      }));
      toast.error('Failed to delete team');
      throw error;
    }
  },

  addTeamMember: async (teamId: string, userId: string, role: string = 'member') => {
    set({ isLoading: true, error: null });
    try {
      await apiService.post(`/teams/${teamId}/members`, { user_id: userId, role });
      await get().fetchTeamMembers(teamId);
      toast.success('Member added successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add member';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  removeTeamMember: async (teamId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.delete(`/teams/${teamId}/members/user/${userId}`);
      set((state) => ({
        currentTeamMembers: state.currentTeamMembers.filter((m) => m.user_id !== userId),
        isLoading: false,
      }));
      toast.success('Member removed successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove member';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateMemberRole: async (teamId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.put(`/teams/${teamId}/members/user/${userId}`, { role });
      await get().fetchTeamMembers(teamId);
      toast.success('Member role updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update member role';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));