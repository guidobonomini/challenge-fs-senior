import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  assignUsersToTask,
  unassignUserFromTask,
  getTaskAssignments,
  getTeamWorkloads,
  getAssignmentSuggestions,
  getUserAssignedTasks,
} from '../controllers/assignmentController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Task assignment routes
router.post('/tasks/:taskId/assign', assignUsersToTask);
router.delete('/tasks/:taskId/users/:assignmentUserId', unassignUserFromTask);
router.get('/tasks/:taskId', getTaskAssignments);

// Assignment suggestions
router.get('/tasks/:taskId/suggestions', getAssignmentSuggestions);

// Team workload analysis
router.get('/teams/:teamId/workloads', getTeamWorkloads);

// User's assigned tasks
router.get('/users/:userId/tasks', getUserAssignedTasks);

export default router;