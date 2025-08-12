import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../middleware/validation';
import { userRegistrationSchema } from '../../utils/validation';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should call next() for valid data', () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe'
    };

    const validationMiddleware = validateRequest(userRegistrationSchema);
    validationMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 400 for invalid data', () => {
    req.body = {
      email: 'invalid-email', // Invalid email
      password: '123', // Too short
      first_name: '', // Empty required field
      last_name: 'Doe'
    };

    const validationMiddleware = validateRequest(userRegistrationSchema);
    validationMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Validation failed')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 400 for missing required fields', () => {
    req.body = {
      email: 'test@example.com'
      // Missing other required fields
    };

    const validationMiddleware = validateRequest(userRegistrationSchema);
    validationMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Validation failed')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle empty request body', () => {
    req.body = undefined;

    const validationMiddleware = validateRequest(userRegistrationSchema);
    validationMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Validation failed')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});