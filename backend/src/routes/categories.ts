import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = Router();

// All category routes require authentication
router.use(authenticate);
router.use(generalRateLimit);

// GET /api/categories?page=1&limit=100
router.get('/', getCategories);

// GET /api/categories/:id
router.get('/:id', getCategory);

// POST /api/categories
router.post('/', createCategory);

// PUT /api/categories/:id
router.put('/:id', updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', deleteCategory);

export default router;