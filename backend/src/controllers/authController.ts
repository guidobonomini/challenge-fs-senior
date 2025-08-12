import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import redis from '../config/redis';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, generateRandomToken } from '../utils/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, User } from '../types';
import { logger } from '../utils/logger';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;

  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  const hashedPassword = await hashPassword(password);
  const emailVerificationToken = generateRandomToken();

  const [user] = await db('users')
    .insert({
      id: uuidv4(),
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      email_verification_token: emailVerificationToken,
      role: 'member',
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at']);

  logger.info('User registered:', { userId: user.id, email: user.email });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
    },
    token,
    refresh_token: refreshToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await db('users')
    .where({ email, is_active: true })
    .select('id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'email_verified')
    .first() as User & { password_hash: string };

  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw createError('Invalid email or password', 401);
  }

  await db('users')
    .where({ id: user.id })
    .update({ last_login: new Date(), updated_at: new Date() });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

  logger.info('User logged in:', { userId: user.id, email: user.email });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      email_verified: user.email_verified,
    },
    token,
    refresh_token: refreshToken,
  });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw createError('Refresh token is required', 400);
  }

  const storedToken = await redis.get(`refresh_token:${req.user?.id}`);
  if (!storedToken || storedToken !== refresh_token) {
    throw createError('Invalid refresh token', 401);
  }

  const user = req.user!;
  const newToken = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, newRefreshToken);

  res.json({
    token: newToken,
    refresh_token: newRefreshToken,
  });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (userId) {
    await redis.del(`refresh_token:${userId}`);
    logger.info('User logged out:', { userId });
  }

  res.json({ message: 'Logout successful' });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  
  const userProfile = await db('users')
    .where({ id: user.id })
    .select('id', 'email', 'first_name', 'last_name', 'avatar_url', 'role', 'email_verified', 'last_login', 'created_at')
    .first();

  res.json({ user: userProfile });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { first_name, last_name, avatar_url } = req.body;

  const updatedUser = await db('users')
    .where({ id: userId })
    .update({
      first_name,
      last_name,
      avatar_url,
      updated_at: new Date(),
    })
    .returning(['id', 'email', 'first_name', 'last_name', 'avatar_url', 'role']);

  logger.info('User profile updated:', { userId });

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser[0],
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await db('users').where({ email, is_active: true }).first();
  if (!user) {
    res.json({ message: 'If a user with this email exists, a password reset link has been sent.' });
    return;
  }

  const resetToken = generateRandomToken();
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  await db('users')
    .where({ id: user.id })
    .update({
      password_reset_token: resetToken,
      password_reset_expires: resetExpires,
      updated_at: new Date(),
    });

  logger.info('Password reset requested:', { userId: user.id, email });

  res.json({ message: 'If a user with this email exists, a password reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await db('users')
    .where('password_reset_token', token)
    .where('password_reset_expires', '>', new Date())
    .first();

  if (!user) {
    throw createError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await hashPassword(password);

  await db('users')
    .where({ id: user.id })
    .update({
      password_hash: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date(),
    });

  await redis.del(`refresh_token:${user.id}`);

  logger.info('Password reset completed:', { userId: user.id });

  res.json({ message: 'Password reset successful' });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { current_password, new_password } = req.body;

  const user = await db('users')
    .where({ id: userId })
    .select('password_hash')
    .first() as { password_hash: string };

  if (!(await comparePassword(current_password, user.password_hash))) {
    throw createError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(new_password);

  await db('users')
    .where({ id: userId })
    .update({
      password_hash: hashedPassword,
      updated_at: new Date(),
    });

  await redis.del(`refresh_token:${userId}`);

  logger.info('Password changed:', { userId });

  res.json({ message: 'Password changed successfully' });
});