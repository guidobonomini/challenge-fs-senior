import { analyticsService } from './analyticsService';

// Mock the api service
jest.mock('./api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

import apiService from './api';
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskStatusAnalytics', () => {
    it('should fetch task status analytics', async () => {
      const mockData = {
        todo: 5,
        in_progress: 3,
        in_review: 2,
        done: 10,
        cancelled: 1,
      };

      mockedApiService.get.mockResolvedValue(mockData);

      const result = await analyticsService.getTaskStatusAnalytics();

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/task-status', {});
      expect(result).toEqual(mockData);
    });

    it('should include project and team filters', async () => {
      const mockData = {};
      mockedApiService.get.mockResolvedValue(mockData);

      await analyticsService.getTaskStatusAnalytics('project-1', 'team-1');

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/task-status', {
        project_id: 'project-1',
        team_id: 'team-1'
      });
    });
  });

  describe('getTaskProgressAnalytics', () => {
    it('should fetch task progress analytics', async () => {
      const mockData = [
        {
          date: '2023-01-01',
          completed: 5,
          total: 10,
          completionRate: 50.0,
        },
      ];

      mockedApiService.get.mockResolvedValue(mockData);

      const result = await analyticsService.getTaskProgressAnalytics();

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/task-progress', {
        time_range: 'month'
      });
      expect(result).toEqual(mockData);
    });

    it('should include time range parameter', async () => {
      const mockData: any[] = [];
      mockedApiService.get.mockResolvedValue(mockData);

      await analyticsService.getTaskProgressAnalytics(undefined, undefined, 'week');

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/task-progress', {
        time_range: 'week'
      });
    });
  });

  describe('getTeamWorkloadAnalytics', () => {
    it('should fetch team workload analytics', async () => {
      const mockData = [
        {
          user_id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          total_tasks: 10,
          active_tasks: 5,
          high_priority_tasks: 2,
          overdue_tasks: 1,
          workload_score: 8,
        },
      ];

      mockedApiService.get.mockResolvedValue(mockData);

      const result = await analyticsService.getTeamWorkloadAnalytics('team-1');

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/team-workload/team-1');
      expect(result).toEqual(mockData);
    });
  });

  describe('getVelocityAnalytics', () => {
    it('should fetch velocity analytics', async () => {
      const mockData = [
        {
          period: 'Sprint 1',
          planned: 10,
          completed: 8,
          storyPoints: 25,
        },
      ];

      mockedApiService.get.mockResolvedValue(mockData);

      const result = await analyticsService.getVelocityAnalytics('team-1');

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/velocity/team-1', {
        period_type: 'sprint',
        periods: 6
      });
      expect(result).toEqual(mockData);
    });

    it('should include custom parameters', async () => {
      const mockData: any[] = [];
      mockedApiService.get.mockResolvedValue(mockData);

      await analyticsService.getVelocityAnalytics('team-1', 'week', 10);

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/velocity/team-1', {
        period_type: 'week',
        periods: 10
      });
    });
  });

  // getBurndownAnalytics method was removed - tests commented out
  // describe('getBurndownAnalytics', () => { ... });

  describe('getPriorityDistributionAnalytics', () => {
    it('should fetch priority distribution analytics', async () => {
      const mockData = {
        low: 5,
        medium: 10,
        high: 8,
        urgent: 2,
      };

      mockedApiService.get.mockResolvedValue(mockData);

      const result = await analyticsService.getPriorityDistributionAnalytics();

      expect(mockedApiService.get).toHaveBeenCalledWith('/analytics/priority-distribution', {});
      expect(result).toEqual(mockData);
    });
  });

  describe('Sample data generators', () => {
    it('should generate sample task status data', () => {
      const data = analyticsService.generateSampleTaskStatusData();

      expect(data).toHaveProperty('todo');
      expect(data).toHaveProperty('in_progress');
      expect(data).toHaveProperty('in_review');
      expect(data).toHaveProperty('done');
      expect(data).toHaveProperty('cancelled');

      expect(typeof data.todo).toBe('number');
      expect(typeof data.in_progress).toBe('number');
      expect(typeof data.in_review).toBe('number');
      expect(typeof data.done).toBe('number');
      expect(typeof data.cancelled).toBe('number');

      expect(data.todo).toBeGreaterThanOrEqual(0);
      expect(data.in_progress).toBeGreaterThanOrEqual(0);
      expect(data.in_review).toBeGreaterThanOrEqual(0);
      expect(data.done).toBeGreaterThanOrEqual(0);
      expect(data.cancelled).toBeGreaterThanOrEqual(0);
    });

    it('should generate sample progress data', () => {
      const days = 7;
      const data = analyticsService.generateSampleProgressData(days);

      expect(data).toHaveLength(days);
      
      data.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('completed');
        expect(point).toHaveProperty('total');
        expect(point).toHaveProperty('completionRate');

        expect(typeof point.date).toBe('string');
        expect(typeof point.completed).toBe('number');
        expect(typeof point.total).toBe('number');
        expect(typeof point.completionRate).toBe('number');

        expect(point.completed).toBeGreaterThanOrEqual(0);
        expect(point.total).toBeGreaterThanOrEqual(0);
        expect(point.completionRate).toBeGreaterThanOrEqual(0);
        expect(point.completionRate).toBeLessThanOrEqual(100);
      });
    });

    it('should generate sample team workload data', () => {
      const data = analyticsService.generateSampleTeamWorkloadData();

      expect(data.length).toBeGreaterThan(0);
      
      data.forEach(member => {
        expect(member).toHaveProperty('user_id');
        expect(member).toHaveProperty('first_name');
        expect(member).toHaveProperty('last_name');
        expect(member).toHaveProperty('total_tasks');
        expect(member).toHaveProperty('active_tasks');
        expect(member).toHaveProperty('high_priority_tasks');
        expect(member).toHaveProperty('overdue_tasks');
        expect(member).toHaveProperty('workload_score');

        expect(typeof member.first_name).toBe('string');
        expect(typeof member.last_name).toBe('string');
        expect(typeof member.total_tasks).toBe('number');
        expect(typeof member.active_tasks).toBe('number');
        expect(typeof member.high_priority_tasks).toBe('number');
        expect(typeof member.overdue_tasks).toBe('number');
        expect(typeof member.workload_score).toBe('number');

        expect(member.total_tasks).toBeGreaterThanOrEqual(0);
        expect(member.active_tasks).toBeGreaterThanOrEqual(0);
        expect(member.high_priority_tasks).toBeGreaterThanOrEqual(0);
        expect(member.overdue_tasks).toBeGreaterThanOrEqual(0);
        expect(member.workload_score).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate sample velocity data', () => {
      const data = analyticsService.generateSampleVelocityData();

      expect(data).toHaveLength(6);
      
      data.forEach((sprint, index) => {
        expect(sprint).toHaveProperty('period');
        expect(sprint).toHaveProperty('planned');
        expect(sprint).toHaveProperty('completed');
        expect(sprint).toHaveProperty('storyPoints');

        expect(sprint.period).toBe(`Sprint ${index + 1}`);
        expect(typeof sprint.planned).toBe('number');
        expect(typeof sprint.completed).toBe('number');
        expect(typeof sprint.storyPoints).toBe('number');

        expect(sprint.planned).toBeGreaterThanOrEqual(0);
        expect(sprint.completed).toBeGreaterThanOrEqual(0);
        expect(sprint.storyPoints).toBeGreaterThanOrEqual(0);
        expect(sprint.completed).toBeLessThanOrEqual(sprint.planned);
      });
    });
  });
});