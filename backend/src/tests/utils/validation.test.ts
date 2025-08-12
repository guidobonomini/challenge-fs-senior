import { 
  userRegistrationSchema, 
  userLoginSchema, 
  taskSchema, 
  commentSchema 
} from '../../utils/validation';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    test('should validate correct user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const { error } = userRegistrationSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const { error } = userRegistrationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('email');
    });

    test('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const { error } = userRegistrationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('password');
    });

    test('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const { error } = userRegistrationSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('userLoginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error } = userLoginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject missing email', () => {
      const invalidData = {
        password: 'password123'
      };

      const { error } = userLoginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('email');
    });
  });

  describe('taskSchema', () => {
    test('should validate correct task data', () => {
      const validData = {
        title: 'Test Task',
        description: 'Task description',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'todo',
        priority: 'medium',
        type: 'task'
      };

      const { error } = taskSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid status', () => {
      const invalidData = {
        title: 'Test Task',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid_status'
      };

      const { error } = taskSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('status');
    });

    test('should reject missing title', () => {
      const invalidData = {
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const { error } = taskSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('title');
    });
  });

  describe('commentSchema', () => {
    test('should validate correct comment data', () => {
      const validData = {
        content: 'This is a test comment'
      };

      const { error } = commentSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject empty content', () => {
      const invalidData = {
        content: ''
      };

      const { error } = commentSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('content');
    });
  });
});