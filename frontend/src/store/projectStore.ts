import { create } from 'zustand';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

export interface Project {
  id: string;
  name: string;
  description: string;
  team_id: string;
  owner_id: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string;
  due_date: string;
  progress: number;
  color: string;
  created_at: string;
  updated_at: string;
  team_name?: string;
  task_stats?: {
    total: number;
    completed: number;
    todo: number;
    in_progress: number;
    in_review: number;
  };
  _optimistic?: boolean;
}

interface CreateProjectData {
  name: string;
  description?: string;
  team_id: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  due_date?: string;
  color?: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  fetchProjects: (params?: any) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (id: string, data: Partial<CreateProjectData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  fetchProjects: async (params?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<any>('/projects', params);
      set({
        projects: response.projects || [],
        pagination: response.pagination || get().pagination,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<any>(`/projects/${id}`);
      set({
        currentProject: response.project || null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createProject: async (data: CreateProjectData) => {
    // Optimistic update: Create temporary project immediately
    const optimisticProject = {
      id: `temp-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      team_id: data.team_id,
      owner_id: '', // Will be set by backend
      status: data.status || 'planning',
      priority: data.priority || 'medium',
      start_date: data.start_date || '',
      due_date: data.due_date || '',
      progress: 0,
      color: data.color || '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: true,
    } as Project;

    // Add optimistic project to state immediately
    set((state) => ({
      projects: [optimisticProject, ...state.projects],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.post<any>('/projects', data);
      
      // Replace optimistic project with real one
      set((state) => ({
        projects: state.projects.map(project => 
          project.id === optimisticProject.id && response.project
            ? { ...response.project, _optimistic: false }
            : project
        ),
        isLoading: false,
      }));
      
      toast.success('Project created successfully');
    } catch (error: any) {
      // Remove optimistic project on error
      set((state) => ({
        projects: state.projects.filter(project => project.id !== optimisticProject.id),
        error: error.response?.data?.error || 'Failed to create project',
        isLoading: false,
      }));
      toast.error('Failed to create project');
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<CreateProjectData>) => {
    // Store original project state for potential rollback
    const originalState = get();
    const originalProject = originalState.projects.find(project => project.id === id);
    
    if (!originalProject) {
      throw new Error('Project not found');
    }

    // Optimistic update: Update project immediately
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString(), _optimistic: true } : p
      ),
      currentProject: state.currentProject?.id === id 
        ? { ...state.currentProject, ...data, updated_at: new Date().toISOString(), _optimistic: true }
        : state.currentProject,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await apiService.put<any>(`/projects/${id}`, data);
      
      // Replace optimistic update with server response
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id && response.project ? { ...response.project, _optimistic: false } : p
        ),
        currentProject: state.currentProject?.id === id && response.project
          ? { ...response.project, _optimistic: false }
          : state.currentProject,
        isLoading: false,
      }));
      
      toast.success('Project updated successfully');
    } catch (error: any) {
      // Rollback optimistic update on error
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...originalProject, _optimistic: false } : p
        ),
        currentProject: state.currentProject?.id === id
          ? { ...originalProject, _optimistic: false }
          : state.currentProject,
        error: error.response?.data?.error || 'Failed to update project',
        isLoading: false,
      }));
      toast.error('Failed to update project');
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    // Store original project for potential rollback
    const originalState = get();
    const projectToDelete = originalState.projects.find(project => project.id === id);
    
    if (!projectToDelete) {
      throw new Error('Project not found');
    }

    // Optimistic update: Remove project immediately
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
      isLoading: true,
      error: null,
    }));

    try {
      await apiService.delete(`/projects/${id}`);
      
      // Confirm deletion (project already removed)
      set({ isLoading: false });
      toast.success('Project archived successfully');
    } catch (error: any) {
      // Rollback: Restore deleted project
      const projectIndex = originalState.projects.findIndex(project => project.id === id);
      set((state) => ({
        projects: [
          ...state.projects.slice(0, projectIndex >= 0 ? projectIndex : state.projects.length),
          { ...projectToDelete, _optimistic: false },
          ...state.projects.slice(projectIndex >= 0 ? projectIndex : state.projects.length),
        ],
        currentProject: originalState.currentProject?.id === id ? originalState.currentProject : state.currentProject,
        error: error.response?.data?.error || 'Failed to delete project',
        isLoading: false,
      }));
      toast.error('Failed to delete project');
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));