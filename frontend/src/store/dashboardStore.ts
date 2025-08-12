import { create } from 'zustand';
import { apiService } from '../services/api';

export interface DashboardStats {
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    todo: number;
  };
  projectStats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  teamStats: {
    totalTeams: number;
    totalMembers: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'task_completed' | 'task_created' | 'project_created' | 'comment_added' | 'member_joined';
  user: {
    id: string;
    name: string;
    initials: string;
    avatar_url?: string;
  };
  description: string;
  timestamp: string;
  relatedEntity?: {
    id: string;
    name: string;
    type: 'task' | 'project' | 'team';
  };
}

interface DashboardState {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchRecentActivities: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recentActivities: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all data in parallel
      const [statsResponse, activitiesResponse] = await Promise.all([
        useDashboardStore.getState().fetchStats(),
        useDashboardStore.getState().fetchRecentActivities(),
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch dashboard data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const now = new Date();

      // Fetch task counts by status using API pagination totals for accurate counts
      const [allTasksResponse, todoTasksResponse, inProgressTasksResponse, doneTasksResponse] = await Promise.all([
        apiService.get<any>('/tasks', { limit: 1 }),
        apiService.get<any>('/tasks', { limit: 1, status: 'todo' }),
        apiService.get<any>('/tasks', { limit: 1, status: 'in_progress' }),
        apiService.get<any>('/tasks', { limit: 1, status: 'done' }),
      ]);

      // Get a reasonable sample of tasks to calculate overdue count (fallback)
      const sampleTasksResponse = await apiService.get<any>('/tasks', { limit: 100 });
      const sampleTasks = sampleTasksResponse.tasks || [];
      const overdueCount = sampleTasks.filter((t: any) => {
        if (t.due_date && t.status !== 'done') {
          return new Date(t.due_date) < now;
        }
        return false;
      }).length;

      const taskStats = {
        total: allTasksResponse.pagination?.total || 0,
        completed: doneTasksResponse.pagination?.total || 0,
        inProgress: inProgressTasksResponse.pagination?.total || 0,
        todo: todoTasksResponse.pagination?.total || 0,
        overdue: overdueCount, // This is approximate based on sample, ideally would need separate API endpoint
      };

      // Fetch project counts by status
      const [allProjectsResponse, activeProjectsResponse, completedProjectsResponse, onHoldProjectsResponse] = await Promise.all([
        apiService.get<any>('/projects', { limit: 1 }),
        apiService.get<any>('/projects', { limit: 1, status: 'active' }),
        apiService.get<any>('/projects', { limit: 1, status: 'completed' }),
        apiService.get<any>('/projects', { limit: 1, status: 'on_hold' }),
      ]);

      const projectStats = {
        total: allProjectsResponse.pagination?.total || 0,
        active: activeProjectsResponse.pagination?.total || 0,
        completed: completedProjectsResponse.pagination?.total || 0,
        onHold: onHoldProjectsResponse.pagination?.total || 0,
      };

      // Calculate team stats
      const teamsResponse = await apiService.get<any>('/teams', { limit: 1 });
      const teamStats = {
        totalTeams: teamsResponse.pagination?.total || 0,
        totalMembers: teamsResponse.teams?.reduce((acc: number, team: any) => 
          acc + (team.member_count || 0), 0) || 0,
      };

      set({
        stats: {
          taskStats,
          projectStats,
          teamStats,
        },
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      // Set default stats on error
      set({
        stats: {
          taskStats: { total: 0, completed: 0, inProgress: 0, overdue: 0, todo: 0 },
          projectStats: { total: 0, active: 0, completed: 0, onHold: 0 },
          teamStats: { totalTeams: 0, totalMembers: 0 },
        },
      });
    }
  },

  fetchRecentActivities: async () => {
    try {
      // Fetch recent tasks and projects
      const [tasksResponse, projectsResponse] = await Promise.all([
        apiService.get<any>('/tasks', { limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
        apiService.get<any>('/projects', { limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);

      const activities: RecentActivity[] = [];

      // Convert tasks to activities
      (tasksResponse.tasks || []).forEach((task: any) => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task_created',
          user: {
            id: task.assignee_id || 'system',
            name: task.assignee_name || 'System',
            initials: task.assignee_name ? 
              task.assignee_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 
              'SY',
          },
          description: `Created task "${task.title}"`,
          timestamp: task.created_at,
          relatedEntity: {
            id: task.id,
            name: task.title,
            type: 'task',
          },
        });
      });

      // Convert projects to activities
      (projectsResponse.projects || []).forEach((project: any) => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project_created',
          user: {
            id: project.owner_id || 'system',
            name: project.owner_name || 'System',
            initials: project.owner_name ? 
              project.owner_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 
              'SY',
          },
          description: `Created project "${project.name}"`,
          timestamp: project.created_at,
          relatedEntity: {
            id: project.id,
            name: project.name,
            type: 'project',
          },
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      set({
        recentActivities: activities.slice(0, 10), // Keep only 10 most recent
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      set({ recentActivities: [] });
    }
  },

  clearError: () => set({ error: null }),
}));