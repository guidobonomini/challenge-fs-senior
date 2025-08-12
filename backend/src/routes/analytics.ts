import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTaskStatusAnalytics,
  getTaskProgressAnalytics,
  getTeamWorkloadAnalytics,
  getVelocityAnalytics,
  getPriorityDistributionAnalytics,
  getTimeTrackingAnalytics
} from '../controllers/analyticsController';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Task status analytics
router.get('/task-status', getTaskStatusAnalytics);

// Task progress over time
router.get('/task-progress', getTaskProgressAnalytics);

// Team workload analytics
router.get('/team-workload/:teamId', getTeamWorkloadAnalytics);

// Team velocity analytics
router.get('/velocity/:teamId', getVelocityAnalytics);

// Priority distribution analytics
router.get('/priority-distribution', getPriorityDistributionAnalytics);

// Time tracking analytics
router.get('/time-tracking', getTimeTrackingAnalytics);

export default router;