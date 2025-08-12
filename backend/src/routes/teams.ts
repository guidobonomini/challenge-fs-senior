import { Router } from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  removeTeamMemberByUserId,
  updateTeamMemberByUserId,
  getTeamMembers,
  leaveTeam,
} from '../controllers/teamController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { teamSchema, paginationSchema } from '../utils/validation';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(teamSchema), createTeam);
router.get('/', validateRequest(paginationSchema, 'query'), getTeams);
router.get('/:id', getTeam);
router.put('/:id', validateRequest(teamSchema), updateTeam);
router.delete('/:id', deleteTeam);

router.get('/:id/members', getTeamMembers);
router.post('/:id/members', addTeamMember);
router.put('/:id/members/:memberId', updateTeamMember);
router.delete('/:id/members/:memberId', removeTeamMember);
router.put('/:id/members/user/:userId', updateTeamMemberByUserId);
router.delete('/:id/members/user/:userId', removeTeamMemberByUserId);
router.post('/:id/leave', leaveTeam);

export default router;