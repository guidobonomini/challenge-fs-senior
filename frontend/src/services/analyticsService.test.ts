import axios from 'axios';
import { analyticsService } from './analyticsService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  describe('getTaskStatusAnalytics', () => {
    it('should fetch task status analytics', async () => {
      const mockResponse = {
        data: {
          data: {
            todo: 5,
            in_progress: 3,
            in_review: 2,
            done: 10,
            cancelled: 1,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getTaskStatusAnalytics();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/task-status?'
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should include project and team filters', async () => {
      const mockResponse = { data: { data: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await analyticsService.getTaskStatusAnalytics('project-1', 'team-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/task-status?project_id=project-1&team_id=team-1'
      );
    });
  });

  describe('getTaskProgressAnalytics', () => {
    it('should fetch task progress analytics', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              date: '2023-01-01',
              completed: 5,
              total: 10,
              completionRate: 50.0,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getTaskProgressAnalytics();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/task-progress?time_range=month'
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should include time range parameter', async () => {
      const mockResponse = { data: { data: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await analyticsService.getTaskProgressAnalytics(undefined, undefined, 'week');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/task-progress?time_range=week'
      );
    });
  });

  describe('getTeamWorkloadAnalytics', () => {
    it('should fetch team workload analytics', async () => {
      const mockResponse = {
        data: {
          data: [
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
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getTeamWorkloadAnalytics('team-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/team-workload/team-1'
      );
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('getVelocityAnalytics', () => {
    it('should fetch velocity analytics', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              period: 'Sprint 1',
              planned: 10,
              completed: 8,
              storyPoints: 25,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getVelocityAnalytics('team-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/velocity/team-1?period_type=sprint&periods=6'
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should include custom parameters', async () => {
      const mockResponse = { data: { data: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await analyticsService.getVelocityAnalytics('team-1', 'week', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/velocity/team-1?period_type=week&periods=10'
      );
    });
  });

  describe('getBurndownAnalytics', () => {
    it('should fetch burndown analytics', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              date: '2023-01-01',
              remaining: 20,
              ideal: 18,
              actual: 15,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getBurndownAnalytics('project-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/burndown/project-1?'
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should include sprint filter', async () => {
      const mockResponse = { data: { data: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await analyticsService.getBurndownAnalytics('project-1', 'sprint-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/burndown/project-1?sprint_id=sprint-1'
      );
    });
  });

  describe('getPriorityDistributionAnalytics', () => {
    it('should fetch priority distribution analytics', async () => {
      const mockResponse = {
        data: {
          data: {
            low: 5,
            medium: 10,
            high: 8,
            critical: 2,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await analyticsService.getPriorityDistributionAnalytics();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/priority-distribution?'
      );
      expect(result).toEqual(mockResponse.data.data);
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