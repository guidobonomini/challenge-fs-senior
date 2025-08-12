import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskPosition,
  assignTask,
  bulkUpdateTasks,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { taskSchema, taskFilterSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(taskSchema), createTask);
router.get('/', validateRequest(taskFilterSchema, 'query'), getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.patch('/:id/position', updateTaskPosition);
router.patch('/:id/assign', assignTask);
router.patch('/bulk-update', bulkUpdateTasks);

export default router;