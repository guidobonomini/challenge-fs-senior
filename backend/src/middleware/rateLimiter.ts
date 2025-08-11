import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for auth routes (increased for development)
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Authentication rate limit exceeded:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    error: 'Too many requests for this operation, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dynamic rate limiter function
export const rateLimiter = (options: { windowMs: number; max: number }) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};