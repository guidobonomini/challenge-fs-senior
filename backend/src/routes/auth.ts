import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import {
  userRegistrationSchema,
  userLoginSchema,
  passwordResetSchema,
  passwordUpdateSchema,
} from '../utils/validation';

const router = Router();

router.post('/register', authRateLimit, validateRequest(userRegistrationSchema), register);
router.post('/login', authRateLimit, validateRequest(userLoginSchema), login);
router.post('/refresh-token', authenticate, refreshToken);
router.post('/logout', authenticate, logout);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

router.post('/forgot-password', strictRateLimit, validateRequest(passwordResetSchema), forgotPassword);
router.post('/reset-password', strictRateLimit, validateRequest(passwordUpdateSchema), resetPassword);
router.put('/change-password', authenticate, changePassword);

export default router;