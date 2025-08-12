import { Response } from 'express';
import { assignmentService } from '../services/assignmentService';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import db from '../config/database';

export const assignUsersToTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId } = req.params;
  const { assignments, notes } = req.body;

  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    throw createError('Assignments array is required', 400);
  }

  // Validate assignment format
  for (const assignment of assignments) {
    if (!assignment.user_id) {
      throw createError('Each assignment must have a user_id', 400);
    }
    
    if (assignment.role && !['assignee', 'reviewer', 'collaborator'].includes(assignment.role)) {
      throw createError('Invalid assignment role', 400);
    }
  }

  // Check if user has access to the task
  let hasAccess = false;
  if (userRole === 'admin') {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*', 'p.team_id')
      .first();
    hasAccess = !!task;
  } else {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .whereIn('tm.role', ['admin', 'manager'])
      .where('t.is_archived', false)
      .select('t.*', 'p.team_id')
      .first();
    hasAccess = !!task;
  }

  if (!hasAccess) {
    throw createError('Task not found or insufficient permissions', 404);
  }

  // Verify all users belong to the same team
  const task = await db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .where('t.id', taskId)
    .select('p.team_id')
    .first();

  const userIds = assignments.map(a => a.user_id);
  const teamMembers = await db('team_members')
    .whereIn('user_id', userIds)
    .where('team_id', task.team_id)
    .select('user_id');

  const validUserIds = teamMembers.map(tm => tm.user_id);
  const invalidUsers = userIds.filter(id => !validUserIds.includes(id));

  if (invalidUsers.length > 0) {
    throw createError('Some users are not members of the task\'s team', 400);
  }

  // Assign users
  const result = await assignmentService.assignUsersToTask(
    taskId,
    assignments.map(a => ({
      user_id: a.user_id,
      role: a.role || 'assignee',
      notes: a.notes || notes
    })),
    userId
  );

  // Emit WebSocket events for real-time updates
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager) {
    const assignedUserIds = result.map(a => a.user_id).filter(id => id !== userId);
    
    for (const assignedUserId of assignedUserIds) {
      if (socketManager.isUserConnected(assignedUserId)) {
        socketManager.emitToUser(assignedUserId, 'task_assigned', {
          task_id: taskId,
          assigned_by: req.user,
          assignment: result.find(r => r.user_id === assignedUserId),
        });
      }
    }
  }

  logger.info('Users assigned to task:', { taskId, assignments: result.length, assignedBy: userId });

  res.status(201).json({
    message: 'Users assigned successfully',
    assignments: result,
  });
});

export const unassignUserFromTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId, assignmentUserId } = req.params;
  const { role, notes } = req.body;

  if (!role || !['assignee', 'reviewer', 'collaborator'].includes(role)) {
    throw createError('Valid role is required', 400);
  }

  // Check permissions (same as assign)
  let hasAccess = false;
  if (userRole === 'admin') {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .first();
    hasAccess = !!task;
  } else {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .whereIn('tm.role', ['admin', 'manager'])
      .where('t.is_archived', false)
      .first();
    hasAccess = !!task;
  }

  if (!hasAccess) {
    throw createError('Task not found or insufficient permissions', 404);
  }

  await assignmentService.unassignUserFromTask(taskId, assignmentUserId, role, userId, notes);

  // Emit WebSocket event
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager && socketManager.isUserConnected(assignmentUserId)) {
    socketManager.emitToUser(assignmentUserId, 'task_unassigned', {
      task_id: taskId,
      unassigned_by: req.user,
      role: role,
    });
  }

  logger.info('User unassigned from task:', { taskId, unassignedUser: assignmentUserId, role, unassignedBy: userId });

  res.json({
    message: 'User unassigned successfully',
  });
});

export const getTaskAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId } = req.params;

  // Check access to task
  let hasAccess = false;
  if (userRole === 'admin') {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .first();
    hasAccess = !!task;
  } else {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .first();
    hasAccess = !!task;
  }

  if (!hasAccess) {
    throw createError('Task not found or access denied', 404);
  }

  const assignments = await assignmentService.getTaskAssignments(taskId);
  const history = await assignmentService.getAssignmentHistory(taskId);

  res.json({
    assignments,
    history,
  });
});

export const getTeamWorkloads = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { teamId } = req.params;

  // Check if user has access to team
  let hasAccess = false;
  if (userRole === 'admin') {
    hasAccess = true;
  } else {
    const teamMember = await db('team_members')
      .where('team_id', teamId)
      .where('user_id', userId)
      .first();
    hasAccess = !!teamMember;
  }

  if (!hasAccess) {
    throw createError('Team not found or access denied', 404);
  }

  const workloads = await assignmentService.getTeamWorkloads(teamId);

  res.json({
    workloads,
  });
});

export const getAssignmentSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId } = req.params;
  const { limit = 5 } = req.query;

  // Check access to task and get team
  let task;
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*', 'p.team_id')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*', 'p.team_id')
      .first();
  }

  if (!task) {
    throw createError('Task not found or access denied', 404);
  }

  const suggestions = await assignmentService.getAssignmentSuggestions(
    taskId, 
    task.team_id,
    parseInt(limit as string)
  );

  res.json({
    suggestions,
  });
});

export const getUserAssignedTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { userId: targetUserId } = req.params;
  const { status } = req.query;

  // Users can only see their own tasks unless they're admin or manager
  let canAccess = false;
  if (userRole === 'admin' || userId === targetUserId) {
    canAccess = true;
  } else {
    // Check if requesting user is manager of any shared team
    const sharedTeams = await db('team_members as tm1')
      .join('team_members as tm2', 'tm1.team_id', 'tm2.team_id')
      .where('tm1.user_id', userId)
      .where('tm2.user_id', targetUserId)
      .where('tm1.role', 'manager')
      .select('tm1.team_id')
      .first();
    
    canAccess = !!sharedTeams;
  }

  if (!canAccess) {
    throw createError('Access denied', 403);
  }

  const statusFilter = status ? (status as string).split(',') : undefined;
  const tasks = await assignmentService.getUserAssignedTasks(targetUserId, statusFilter);

  res.json({
    tasks,
  });
});