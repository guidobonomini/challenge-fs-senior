import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  updateProjectProgress,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { projectSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(projectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

router.get('/:id/members', getProjectMembers);
router.patch('/:id/progress', updateProjectProgress);

export default router;