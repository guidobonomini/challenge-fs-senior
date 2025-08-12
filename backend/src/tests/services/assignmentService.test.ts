import { AssignmentService, TaskAssignment } from '../../services/assignmentService';

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;

  beforeEach(() => {
    assignmentService = new AssignmentService();
  });

  describe('AssignmentService class', () => {
    test('should be instantiable', () => {
      expect(assignmentService).toBeDefined();
      expect(assignmentService).toBeInstanceOf(AssignmentService);
    });

    test('should have expected methods', () => {
      expect(typeof assignmentService.assignUsersToTask).toBe('function');
      expect(typeof assignmentService.unassignUserFromTask).toBe('function');
      expect(typeof assignmentService.getTaskAssignments).toBe('function');
      expect(typeof assignmentService.getAssignmentHistory).toBe('function');
    });
  });

  describe('TaskAssignment interface', () => {
    test('should define correct structure', () => {
      const mockAssignment: TaskAssignment = {
        id: 'assignment-123',
        task_id: 'task-123',
        user_id: 'user-123',
        assigned_by: 'admin-123',
        role: 'assignee',
        assigned_at: new Date()
      };

      expect(mockAssignment).toEqual(expect.objectContaining({
        id: expect.any(String),
        task_id: expect.any(String),
        user_id: expect.any(String),
        assigned_by: expect.any(String),
        role: expect.any(String),
        assigned_at: expect.any(Date)
      }));
    });

    test('should support all role types', () => {
      const roles: Array<TaskAssignment['role']> = ['assignee', 'reviewer', 'collaborator'];
      
      roles.forEach(role => {
        const assignment: TaskAssignment = {
          id: 'test',
          task_id: 'test',
          user_id: 'test',
          assigned_by: 'test',
          role,
          assigned_at: new Date()
        };
        
        expect(['assignee', 'reviewer', 'collaborator']).toContain(assignment.role);
      });
    });
  });
});