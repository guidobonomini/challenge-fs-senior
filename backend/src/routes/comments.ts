import { Router } from 'express';
import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { commentSchema, paginationSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

router.post('/tasks/:task_id', validateRequest(commentSchema), createComment);
router.get('/tasks/:task_id', validateRequest(paginationSchema, 'query'), getTaskComments);
router.put('/:id', validateRequest(commentSchema), updateComment);
router.delete('/:id', deleteComment);

export default router;