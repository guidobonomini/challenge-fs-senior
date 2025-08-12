import { Router } from 'express';
import { searchUsers, getUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimiter';

const router = Router();

// All user routes require authentication
router.use(authenticate);
router.use(generalRateLimit);

// GET /api/users/search?q=query&limit=10
router.get('/search', searchUsers);

// GET /api/users?page=1&limit=20
router.get('/', getUsers);

export default router;