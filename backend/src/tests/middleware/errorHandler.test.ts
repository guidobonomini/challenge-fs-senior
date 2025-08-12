import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should handle validation errors with 400 status', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should handle cast errors with 400 status', () => {
    const error = new Error('Cast to ObjectId failed');
    error.name = 'CastError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid ID format',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should handle JWT errors with 401 status', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should handle token expired errors with 401 status', () => {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should handle duplicate key errors with 409 status', () => {
    const error = new Error('Duplicate key');
    error.name = 'MongoError';
    (error as any).code = 11000;

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Resource already exists',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should handle generic errors with 500 status', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: expect.any(String) })
    });
  });

  test('should not expose stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Test error');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });

    process.env.NODE_ENV = originalEnv;
  });
});