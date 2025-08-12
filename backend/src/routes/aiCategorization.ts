import express from 'express';
import { authenticate as auth } from '../middleware/auth';
import {
  analyzeTask,
  categorizeTask,
  acceptSuggestion,
  rejectSuggestion,
  manualCategorization,
  bulkCategorizeProject,
  getCategorizationStats,
  getTasksWithSuggestions,
  getCategories
} from '../controllers/aiCategorizationController';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Categories
router.get('/categories', getCategories);

// Task categorization routes
router.get('/tasks/:id/analyze', analyzeTask);
router.post('/tasks/:id/categorize', categorizeTask);
router.post('/tasks/:id/accept-suggestion', acceptSuggestion);
router.post('/tasks/:id/reject-suggestion', rejectSuggestion);
router.put('/tasks/:id/category', manualCategorization);

// Bulk operations
router.post('/projects/:project_id/bulk-categorize', bulkCategorizeProject);

// Analytics and reporting
router.get('/stats', getCategorizationStats);
router.get('/tasks/pending-suggestions', getTasksWithSuggestions);

export default router;