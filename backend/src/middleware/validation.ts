import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Convert undefined to empty object for consistent validation behavior
    const dataToValidate = req[property] ?? {};
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', { errorDetails, data: req[property] });

      res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
      });
      return;
    }

    req[property] = value;
    next();
  };
};