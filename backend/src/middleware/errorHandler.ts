import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Sentry } from '../config/sentry';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (statusCode === 500) {
    message = 'Internal server error';
  }

  // Send to Sentry for non-operational errors (500 level errors)
  if (!error.isOperational || statusCode >= 500) {
    Sentry.captureException(error, {
      tags: {
        component: 'errorHandler',
        statusCode: statusCode.toString(),
      },
      extra: {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });
  }

  logger.error('Error:', {
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  const responsePayload: any = { error: message };
  
  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = error.stack;
  }

  res.status(statusCode).json(responsePayload);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};