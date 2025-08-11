import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Types for analytics data
export interface TaskStatusAnalytics {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  cancelled: number;
}

export interface TaskProgressAnalytics {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

export interface TeamWorkloadAnalytics {
  user_id: string;
  first_name: string;
  last_name: string;
  total_tasks: number;
  active_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  workload_score: number;
}

export interface VelocityAnalytics {
  period: string;
  planned: number;
  completed: number;
  storyPoints: number;
}

export interface BurndownAnalytics {
  date: string;
  remaining: number;
  ideal: number;
  actual: number;
}

export interface PriorityDistributionAnalytics {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

class AnalyticsService {
  // Task Status Analytics
  async getTaskStatusAnalytics(projectId?: string, teamId?: string): Promise<TaskStatusAnalytics> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (teamId) params.append('team_id', teamId);

    const response = await axios.get(`${API_BASE_URL}/analytics/task-status?${params}`);
    return response.data.data;
  }

  // Task Progress Over Time
  async getTaskProgressAnalytics(
    projectId?: string,
    teamId?: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TaskProgressAnalytics[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (teamId) params.append('team_id', teamId);
    params.append('time_range', timeRange);

    const response = await axios.get(`${API_BASE_URL}/analytics/task-progress?${params}`);
    return response.data.data;
  }

  // Team Workload Analytics
  async getTeamWorkloadAnalytics(teamId: string): Promise<TeamWorkloadAnalytics[]> {
    const response = await axios.get(`${API_BASE_URL}/analytics/team-workload/${teamId}`);
    return response.data.data;
  }

  // Velocity Analytics (for sprint-based teams)
  async getVelocityAnalytics(
    teamId: string,
    periodType: 'sprint' | 'week' | 'month' = 'sprint',
    periods: number = 6
  ): Promise<VelocityAnalytics[]> {
    const params = new URLSearchParams();
    params.append('period_type', periodType);
    params.append('periods', periods.toString());

    const response = await axios.get(`${API_BASE_URL}/analytics/velocity/${teamId}?${params}`);
    return response.data.data;
  }

  // Burndown Chart Data
  async getBurndownAnalytics(
    projectId: string,
    sprintId?: string
  ): Promise<BurndownAnalytics[]> {
    const params = new URLSearchParams();
    if (sprintId) params.append('sprint_id', sprintId);

    const response = await axios.get(`${API_BASE_URL}/analytics/burndown/${projectId}?${params}`);
    return response.data.data;
  }

  // Priority Distribution
  async getPriorityDistributionAnalytics(
    projectId?: string,
    teamId?: string
  ): Promise<PriorityDistributionAnalytics> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (teamId) params.append('team_id', teamId);

    const response = await axios.get(`${API_BASE_URL}/analytics/priority-distribution?${params}`);
    return response.data.data;
  }

  // Time Tracking Analytics
  async getTimeTrackingAnalytics(
    projectId?: string,
    teamId?: string,
    timeRange: 'week' | 'month' | 'quarter' = 'month'
  ) {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (teamId) params.append('team_id', teamId);
    params.append('time_range', timeRange);

    const response = await axios.get(`${API_BASE_URL}/analytics/time-tracking?${params}`);
    return response.data.data;
  }

  // User Performance Analytics
  async getUserPerformanceAnalytics(
    userId: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    const params = new URLSearchParams();
    params.append('time_range', timeRange);

    const response = await axios.get(`${API_BASE_URL}/analytics/user-performance/${userId}?${params}`);
    return response.data.data;
  }

  // Project Health Score
  async getProjectHealthScore(projectId: string) {
    const response = await axios.get(`${API_BASE_URL}/analytics/project-health/${projectId}`);
    return response.data.data;
  }

  // Generate sample data for development/testing
  generateSampleTaskStatusData(): TaskStatusAnalytics {
    return {
      todo: Math.floor(Math.random() * 20) + 5,
      in_progress: Math.floor(Math.random() * 15) + 3,
      in_review: Math.floor(Math.random() * 8) + 2,
      done: Math.floor(Math.random() * 30) + 10,
      cancelled: Math.floor(Math.random() * 5),
    };
  }

  generateSampleProgressData(days: number = 30): TaskProgressAnalytics[] {
    const data: TaskProgressAnalytics[] = [];
    const today = new Date();
    let totalTasks = Math.floor(Math.random() * 20) + 10;
    let completedTasks = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate gradual task completion
      const dailyCompletion = Math.floor(Math.random() * 3);
      completedTasks += dailyCompletion;
      
      // Occasionally add new tasks
      if (Math.random() > 0.8) {
        totalTasks += Math.floor(Math.random() * 3) + 1;
      }

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      data.push({
        date: date.toISOString().split('T')[0],
        completed: completedTasks,
        total: totalTasks,
        completionRate: Math.min(100, Math.round(completionRate * 10) / 10),
      });
    }

    return data;
  }

  generateSampleTeamWorkloadData(): TeamWorkloadAnalytics[] {
    const teamMembers = [
      { first_name: 'Alice', last_name: 'Johnson' },
      { first_name: 'Bob', last_name: 'Smith' },
      { first_name: 'Charlie', last_name: 'Brown' },
      { first_name: 'Diana', last_name: 'Wilson' },
      { first_name: 'Eve', last_name: 'Davis' },
    ];

    return teamMembers.map((member, index) => {
      const activeTasks = Math.floor(Math.random() * 8) + 1;
      const highPriorityTasks = Math.floor(Math.random() * 3);
      const overdueTasks = Math.floor(Math.random() * 2);
      const totalTasks = activeTasks + Math.floor(Math.random() * 5) + 2;
      
      return {
        user_id: `user-${index + 1}`,
        first_name: member.first_name,
        last_name: member.last_name,
        total_tasks: totalTasks,
        active_tasks: activeTasks,
        high_priority_tasks: highPriorityTasks,
        overdue_tasks: overdueTasks,
        workload_score: activeTasks + (highPriorityTasks * 2) + (overdueTasks * 3),
      };
    });
  }

  generateSampleVelocityData(): VelocityAnalytics[] {
    const data: VelocityAnalytics[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const planned = Math.floor(Math.random() * 15) + 5;
      const completed = Math.floor(planned * (0.6 + Math.random() * 0.4)); // 60-100% completion
      const storyPoints = Math.floor(Math.random() * 30) + 10;
      
      data.push({
        period: `Sprint ${i}`,
        planned,
        completed,
        storyPoints,
      });
    }
    
    return data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;