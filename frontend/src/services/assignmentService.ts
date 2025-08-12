import axios from 'axios';

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  role: 'assignee' | 'reviewer' | 'collaborator';
  notes?: string;
  assigned_at: string;
  unassigned_at?: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface AssignmentHistory {
  id: string;
  task_id: string;
  user_id: string;
  changed_by: string;
  action: 'assigned' | 'unassigned' | 'role_changed';
  previous_role?: 'assignee' | 'reviewer' | 'collaborator';
  new_role?: 'assignee' | 'reviewer' | 'collaborator';
  notes?: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  changed_by_user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserWorkload {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  total_tasks: number;
  active_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  workload_score: number;
}

export interface AssignmentRequest {
  user_id: string;
  role?: 'assignee' | 'reviewer' | 'collaborator';
  notes?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const assignmentService = {
  // Assign multiple users to a task
  async assignUsersToTask(taskId: string, assignments: AssignmentRequest[]): Promise<TaskAssignment[]> {
    const response = await axios.post(`${API_BASE_URL}/assignments/tasks/${taskId}/assign`, {
      assignments,
    });
    return response.data.assignments;
  },

  // Unassign a user from a task
  async unassignUserFromTask(taskId: string, userId: string, role: string, notes?: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/assignments/tasks/${taskId}/users/${userId}`, {
      data: { role, notes },
    });
  },

  // Get task assignments and history
  async getTaskAssignments(taskId: string): Promise<{
    assignments: TaskAssignment[];
    history: AssignmentHistory[];
  }> {
    const response = await axios.get(`${API_BASE_URL}/assignments/tasks/${taskId}`);
    return response.data;
  },

  // Get team workload analysis
  async getTeamWorkloads(teamId: string): Promise<UserWorkload[]> {
    const response = await axios.get(`${API_BASE_URL}/assignments/teams/${teamId}/workloads`);
    return response.data.workloads;
  },

  // Get assignment suggestions for a task
  async getAssignmentSuggestions(taskId: string, limit: number = 5): Promise<UserWorkload[]> {
    const response = await axios.get(`${API_BASE_URL}/assignments/tasks/${taskId}/suggestions`, {
      params: { limit },
    });
    return response.data.suggestions;
  },

  // Get user's assigned tasks
  async getUserAssignedTasks(userId: string, status?: string[]): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/assignments/users/${userId}/tasks`, {
      params: status ? { status: status.join(',') } : {},
    });
    return response.data.tasks;
  },

  // Utility functions
  getRoleDisplayName(role: 'assignee' | 'reviewer' | 'collaborator'): string {
    switch (role) {
      case 'assignee':
        return 'Assignee';
      case 'reviewer':
        return 'Reviewer';
      case 'collaborator':
        return 'Collaborator';
      default:
        return role;
    }
  },

  getRoleColor(role: 'assignee' | 'reviewer' | 'collaborator'): string {
    switch (role) {
      case 'assignee':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'reviewer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'collaborator':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  },

  getWorkloadStatus(workload: UserWorkload): {
    status: 'low' | 'medium' | 'high' | 'overloaded';
    color: string;
    label: string;
  } {
    const score = workload.workload_score;
    
    if (score === 0) {
      return {
        status: 'low',
        color: 'bg-green-100 text-green-800',
        label: 'Available',
      };
    } else if (score <= 5) {
      return {
        status: 'low',
        color: 'bg-green-100 text-green-800',
        label: 'Light Load',
      };
    } else if (score <= 10) {
      return {
        status: 'medium',
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Moderate Load',
      };
    } else if (score <= 15) {
      return {
        status: 'high',
        color: 'bg-orange-100 text-orange-800',
        label: 'Heavy Load',
      };
    } else {
      return {
        status: 'overloaded',
        color: 'bg-red-100 text-red-800',
        label: 'Overloaded',
      };
    }
  },

  formatAssignmentAction(action: string): string {
    switch (action) {
      case 'assigned':
        return 'was assigned';
      case 'unassigned':
        return 'was unassigned';
      case 'role_changed':
        return 'role was changed';
      default:
        return action;
    }
  },
};