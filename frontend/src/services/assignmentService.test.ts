import axios from 'axios';
import { assignmentService } from './assignmentService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AssignmentService', () => {
  const mockAssignment = {
    id: 'assignment-1',
    task_id: 'task-1',
    user_id: 'user-1',
    assigned_by: 'user-2',
    role: 'assignee' as const,
    assigned_at: '2022-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
  };

  const mockWorkload = {
    user_id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    total_tasks: 5,
    active_tasks: 3,
    high_priority_tasks: 1,
    overdue_tasks: 0,
    workload_score: 5,
  };

  beforeEach(() => {
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
  });

  describe('assignUsersToTask', () => {
    it('should assign users to task successfully', async () => {
      const mockResponse = {
        data: {
          assignments: [mockAssignment],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const assignments = [
        { user_id: 'user-1', role: 'assignee' as const },
      ];

      const result = await assignmentService.assignUsersToTask('task-1', assignments);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/tasks/task-1/assign',
        { assignments }
      );

      expect(result).toEqual([mockAssignment]);
    });

    it('should handle assignment errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'User is already assigned',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        assignmentService.assignUsersToTask('task-1', [{ user_id: 'user-1' }])
      ).rejects.toEqual(mockError);
    });
  });

  describe('unassignUserFromTask', () => {
    it('should unassign user from task', async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await assignmentService.unassignUserFromTask('task-1', 'user-1', 'assignee');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/tasks/task-1/users/user-1',
        {
          data: { role: 'assignee', notes: undefined },
        }
      );
    });
  });

  describe('getTaskAssignments', () => {
    it('should fetch task assignments and history', async () => {
      const mockResponse = {
        data: {
          assignments: [mockAssignment],
          history: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await assignmentService.getTaskAssignments('task-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/tasks/task-1'
      );

      expect(result).toEqual({
        assignments: [mockAssignment],
        history: [],
      });
    });
  });

  describe('getTeamWorkloads', () => {
    it('should fetch team workloads', async () => {
      const mockResponse = {
        data: {
          workloads: [mockWorkload],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await assignmentService.getTeamWorkloads('team-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/teams/team-1/workloads'
      );

      expect(result).toEqual([mockWorkload]);
    });
  });

  describe('getAssignmentSuggestions', () => {
    it('should fetch assignment suggestions', async () => {
      const mockResponse = {
        data: {
          suggestions: [mockWorkload],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await assignmentService.getAssignmentSuggestions('task-1', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/tasks/task-1/suggestions',
        { params: { limit: 5 } }
      );

      expect(result).toEqual([mockWorkload]);
    });
  });

  describe('getUserAssignedTasks', () => {
    it('should fetch user assigned tasks', async () => {
      const mockResponse = {
        data: {
          tasks: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await assignmentService.getUserAssignedTasks('user-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/users/user-1/tasks',
        { params: {} }
      );

      expect(result).toEqual([]);
    });

    it('should fetch user assigned tasks with status filter', async () => {
      const mockResponse = {
        data: {
          tasks: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await assignmentService.getUserAssignedTasks('user-1', ['todo', 'in_progress']);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/assignments/users/user-1/tasks',
        { params: { status: 'todo,in_progress' } }
      );

      expect(result).toEqual([]);
    });
  });

  describe('Utility functions', () => {
    it('should return correct role display names', () => {
      expect(assignmentService.getRoleDisplayName('assignee')).toBe('Assignee');
      expect(assignmentService.getRoleDisplayName('reviewer')).toBe('Reviewer');
      expect(assignmentService.getRoleDisplayName('collaborator')).toBe('Collaborator');
    });

    it('should return correct role colors', () => {
      expect(assignmentService.getRoleColor('assignee')).toContain('bg-blue-100');
      expect(assignmentService.getRoleColor('reviewer')).toContain('bg-purple-100');
      expect(assignmentService.getRoleColor('collaborator')).toContain('bg-green-100');
    });

    it('should calculate workload status correctly', () => {
      // Available
      const availableWorkload = { ...mockWorkload, workload_score: 0 };
      const availableStatus = assignmentService.getWorkloadStatus(availableWorkload);
      expect(availableStatus.status).toBe('low');
      expect(availableStatus.label).toBe('Available');

      // Light load
      const lightWorkload = { ...mockWorkload, workload_score: 3 };
      const lightStatus = assignmentService.getWorkloadStatus(lightWorkload);
      expect(lightStatus.status).toBe('low');
      expect(lightStatus.label).toBe('Light Load');

      // Moderate load
      const moderateWorkload = { ...mockWorkload, workload_score: 8 };
      const moderateStatus = assignmentService.getWorkloadStatus(moderateWorkload);
      expect(moderateStatus.status).toBe('medium');
      expect(moderateStatus.label).toBe('Moderate Load');

      // Heavy load
      const heavyWorkload = { ...mockWorkload, workload_score: 12 };
      const heavyStatus = assignmentService.getWorkloadStatus(heavyWorkload);
      expect(heavyStatus.status).toBe('high');
      expect(heavyStatus.label).toBe('Heavy Load');

      // Overloaded
      const overloadedWorkload = { ...mockWorkload, workload_score: 20 };
      const overloadedStatus = assignmentService.getWorkloadStatus(overloadedWorkload);
      expect(overloadedStatus.status).toBe('overloaded');
      expect(overloadedStatus.label).toBe('Overloaded');
    });

    it('should format assignment actions correctly', () => {
      expect(assignmentService.formatAssignmentAction('assigned')).toBe('was assigned');
      expect(assignmentService.formatAssignmentAction('unassigned')).toBe('was unassigned');
      expect(assignmentService.formatAssignmentAction('role_changed')).toBe('role was changed');
      expect(assignmentService.formatAssignmentAction('custom')).toBe('custom');
    });
  });
});