import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const {
    title,
    description,
    project_id,
    assignee_id,
    status,
    priority,
    type,
    story_points,
    time_estimate,
    due_date,
    parent_task_id,
  } = req.body;

  // Global administrators can create tasks in any project
  let hasAccess = false;
  if (userRole === 'admin') {
    const projectExists = await db('projects')
      .where('id', project_id)
      .where('is_archived', false)
      .first();
    hasAccess = !!projectExists;
  } else {
    hasAccess = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', project_id)
      .where('tm.user_id', userId)
      .where('p.is_archived', false)
      .first();
  }

  if (!hasAccess) {
    throw createError('Project not found or access denied', 404);
  }

  if (assignee_id) {
    const assigneeAccess = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', project_id)
      .where('tm.user_id', assignee_id)
      .first();

    if (!assigneeAccess) {
      throw createError('Assignee is not a member of the project team', 400);
    }
  }

  const maxPosition = await db('tasks')
    .where({ project_id, status: status || 'todo' })
    .max('position as max_pos')
    .first();

  const [task] = await db('tasks')
    .insert({
      id: uuidv4(),
      title,
      description,
      project_id,
      assignee_id: assignee_id || null,
      reporter_id: userId,
      status: status || 'todo',
      priority: priority || 'medium',
      type: type || 'task',
      story_points,
      time_estimate,
      time_spent: 0,
      due_date,
      position: (maxPosition?.max_pos || 0) + 1,
      parent_task_id: parent_task_id || null,
      is_archived: false,
      started_at: status === 'in_progress' ? new Date() : null,
      completed_at: status === 'done' ? new Date() : null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'title', 'description', 'project_id', 'assignee_id', 'reporter_id', 'status', 'priority', 'type', 'position', 'created_at']);

  logger.info('Task created:', { taskId: task.id, projectId: project_id, userId });

  // Emit WebSocket event for real-time updates
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager) {
    const taskWithDetails = {
      ...task,
      assignee_name: assignee_id ? await db('users').where('id', assignee_id).select('first_name', 'last_name').first() : null,
      reporter_name: await db('users').where('id', userId).select('first_name', 'last_name').first(),
    };

    socketManager.emitToProject(project_id, 'task_created', {
      task: taskWithDetails,
      project_id,
      created_by: req.user,
    });
  }

  res.status(201).json({
    message: 'Task created successfully',
    task,
  });
});

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const {
    page = 1,
    limit = 50,
    project_id,
    assignee_id,
    status,
    priority,
    type,
    due_date_from,
    due_date_to,
    search,
    sort_by = 'position',
    sort_order = 'asc',
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query;
  
  // Global administrators can see all tasks
  if (userRole === 'admin') {
    query = db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.is_archived', false)
      .where('p.is_archived', false)
      .where('team.is_active', true);
  } else {
    query = db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .where('p.is_archived', false);
  }

  if (project_id) {
    query = query.where('t.project_id', project_id);
  }

  if (assignee_id) {
    query = query.where('t.assignee_id', assignee_id);
  }

  if (status) {
    query = query.where('t.status', status);
  }

  if (priority) {
    query = query.where('t.priority', priority);
  }

  if (type) {
    query = query.where('t.type', type);
  }

  if (due_date_from) {
    query = query.where('t.due_date', '>=', due_date_from);
  }

  if (due_date_to) {
    query = query.where('t.due_date', '<=', due_date_to);
  }

  if (search) {
    query = query.where(function() {
      this.where('t.title', 'ilike', `%${search}%`)
        .orWhere('t.description', 'ilike', `%${search}%`);
    });
  }

  const tasks = await query
    .select(
      't.*',
      'p.name as project_name',
      'p.color as project_color'
    )
    .orderBy(`t.${sort_by}`, sort_order as 'asc' | 'desc')
    .limit(Number(limit))
    .offset(offset);

  // Create a separate query for counting
  let countQuery;
  
  // Global administrators can count all tasks
  if (userRole === 'admin') {
    countQuery = db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.is_archived', false)
      .where('p.is_archived', false)
      .where('team.is_active', true);
  } else {
    countQuery = db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .where('p.is_archived', false);
  }

  if (project_id) {
    countQuery = countQuery.where('t.project_id', project_id);
  }

  if (assignee_id) {
    countQuery = countQuery.where('t.assignee_id', assignee_id);
  }

  if (status) {
    countQuery = countQuery.where('t.status', status);
  }

  if (priority) {
    countQuery = countQuery.where('t.priority', priority);
  }

  if (type) {
    countQuery = countQuery.where('t.type', type);
  }

  if (due_date_from) {
    countQuery = countQuery.where('t.due_date', '>=', due_date_from);
  }

  if (due_date_to) {
    countQuery = countQuery.where('t.due_date', '<=', due_date_to);
  }

  if (search) {
    countQuery = countQuery.where(function() {
      this.where('t.title', 'ilike', `%${search}%`)
        .orWhere('t.description', 'ilike', `%${search}%`);
    });
  }

  const [{ count }] = await countQuery.countDistinct('t.id as count');

  const tasksWithDetails = await Promise.all(
    tasks.map(async (task) => {
      const assignee = task.assignee_id
        ? await db('users')
            .where('id', task.assignee_id)
            .select('id', 'first_name', 'last_name', 'avatar_url')
            .first()
        : null;

      const reporter = await db('users')
        .where('id', task.reporter_id)
        .select('id', 'first_name', 'last_name', 'avatar_url')
        .first();

      const commentCount = await db('comments')
        .where('task_id', task.id)
        .count('* as count')
        .first();

      const attachmentCount = await db('attachments')
        .where('task_id', task.id)
        .count('* as count')
        .first();

      return {
        ...task,
        assignee,
        reporter,
        comment_count: Number(commentCount?.count || 0),
        attachment_count: Number(attachmentCount?.count || 0),
      };
    })
  );

  res.json({
    tasks: tasksWithDetails,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(count),
      pages: Math.ceil(Number(count) / Number(limit)),
    },
  });
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  let task;
  
  // Global administrators can access any task
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', id)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*', 'p.name as project_name', 'p.color as project_color')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', id)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*', 'p.name as project_name', 'p.color as project_color')
      .first();
  }

  if (!task) {
    throw createError('Task not found or access denied', 404);
  }

  const assignee = task.assignee_id
    ? await db('users')
        .where('id', task.assignee_id)
        .select('id', 'first_name', 'last_name', 'email', 'avatar_url')
        .first()
    : null;

  const reporter = await db('users')
    .where('id', task.reporter_id)
    .select('id', 'first_name', 'last_name', 'email', 'avatar_url')
    .first();

  const comments = await db('comments as c')
    .join('users as u', 'c.user_id', 'u.id')
    .where('c.task_id', id)
    .whereNull('c.parent_comment_id')
    .select(
      'c.id',
      'c.content',
      'c.is_edited',
      'c.created_at',
      'c.updated_at',
      'u.id as user_id',
      'u.first_name',
      'u.last_name',
      'u.avatar_url'
    )
    .orderBy('c.created_at', 'desc');

  const attachments = await db('attachments')
    .where('task_id', id)
    .select('id', 'filename', 'original_filename', 'mime_type', 'file_size', 'file_url', 'created_at')
    .orderBy('created_at', 'desc');

  const timeEntries = await db('time_entries as te')
    .join('users as u', 'te.user_id', 'u.id')
    .where('te.task_id', id)
    .select(
      'te.id',
      'te.description',
      'te.duration',
      'te.started_at',
      'te.date',
      'u.first_name',
      'u.last_name'
    )
    .orderBy('te.started_at', 'desc');

  const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

  res.json({
    task: {
      ...task,
      assignee,
      reporter,
      comments,
      attachments,
      time_entries: timeEntries,
      total_time_spent: totalTimeSpent,
    },
  });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;
  const updateData = req.body;

  let task;
  
  // Global administrators can update any task
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', id)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', id)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*')
      .first();
  }

  if (!task) {
    throw createError('Task not found or access denied', 404);
  }

  if (updateData.assignee_id) {
    const assigneeAccess = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', task.project_id)
      .where('tm.user_id', updateData.assignee_id)
      .first();

    if (!assigneeAccess) {
      throw createError('Assignee is not a member of the project team', 400);
    }
  }

  const statusChanged = updateData.status && updateData.status !== task.status;
  const updatedFields: any = {
    ...updateData,
    updated_at: new Date(),
  };

  if (statusChanged) {
    if (updateData.status === 'in_progress' && !task.started_at) {
      updatedFields.started_at = new Date();
    }
    if (updateData.status === 'done' && !task.completed_at) {
      updatedFields.completed_at = new Date();
    }
    if (updateData.status !== 'done' && task.completed_at) {
      updatedFields.completed_at = null;
    }
  }

  const [updatedTask] = await db('tasks')
    .where({ id })
    .update(updatedFields)
    .returning(['id', 'title', 'status', 'priority', 'assignee_id', 'updated_at']);

  logger.info('Task updated:', { taskId: id, userId, changes: Object.keys(updateData) });

  // Emit websocket event for task update
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager) {
    // Emit to the project room, excluding the user who made the change
    const userDetails = await db('users')
      .where('id', userId)
      .select('id', 'first_name', 'last_name', 'avatar_url')
      .first();

    const eventData = {
      task_id: id,
      task: updatedTask,
      changes: Object.keys(updateData),
      updated_by: userDetails,
      project_id: task.project_id,
    };

    // Get all users in the project except the one who made the change
    const projectMembers = await db('team_members as tm')
      .join('projects as p', 'tm.team_id', 'p.team_id')
      .where('p.id', task.project_id)
      .where('tm.user_id', '!=', userId)
      .select('tm.user_id');

    // Emit to each project member individually (excluding the updater)
    projectMembers.forEach(member => {
      if (socketManager.isUserConnected(member.user_id)) {
        socketManager.emitToUser(member.user_id, 'task_updated', eventData);
      }
    });
  }

  res.json({
    message: 'Task updated successfully',
    task: updatedTask,
  });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const task = await db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('t.id', id)
    .where('tm.user_id', userId)
    .whereIn('tm.role', ['admin', 'manager'])
    .where('t.is_archived', false)
    .select('t.*')
    .first();

  if (!task) {
    throw createError('Task not found or insufficient permissions', 404);
  }

  await db('tasks')
    .where({ id })
    .update({ is_archived: true, updated_at: new Date() });

  logger.info('Task archived:', { taskId: id, userId });

  res.json({ message: 'Task archived successfully' });
});

export const updateTaskPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;
  const { status, position } = req.body;

  let task;
  
  // Global administrators can update any task position
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', id)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', id)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*')
      .first();
  }

  if (!task) {
    throw createError('Task not found or access denied', 404);
  }

  await db.transaction(async (trx) => {
    await trx('tasks')
      .where('project_id', task.project_id)
      .where('status', status)
      .where('position', '>=', position)
      .where('id', '!=', id)
      .increment('position', 1);

    await trx('tasks')
      .where({ id })
      .update({
        status,
        position,
        updated_at: new Date(),
        started_at: status === 'in_progress' && !task.started_at ? new Date() : task.started_at,
        completed_at: status === 'done' && !task.completed_at ? new Date() : 
                     status !== 'done' ? null : task.completed_at,
      });
  });

  logger.info('Task position updated:', { taskId: id, status, position, userId });

  // Emit websocket event for task status change
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager && status !== task.status) {
    const userDetails = await db('users')
      .where('id', userId)
      .select('id', 'first_name', 'last_name', 'avatar_url')
      .first();

    const updatedTask = await db('tasks')
      .where('id', id)
      .select('id', 'title', 'status', 'priority', 'assignee_id', 'updated_at')
      .first();

    const eventData = {
      task_id: id,
      task: updatedTask,
      changes: ['status'],
      updated_by: userDetails,
      project_id: task.project_id,
    };

    // Get all users in the project except the one who made the change
    const projectMembers = await db('team_members as tm')
      .join('projects as p', 'tm.team_id', 'p.team_id')
      .where('p.id', task.project_id)
      .where('tm.user_id', '!=', userId)
      .select('tm.user_id');

    // Emit to each project member individually (excluding the updater)
    projectMembers.forEach(member => {
      if (socketManager.isUserConnected(member.user_id)) {
        socketManager.emitToUser(member.user_id, 'task_updated', eventData);
      }
    });
  }

  res.json({ message: 'Task position updated successfully' });
});

export const assignTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;
  const { assignee_id } = req.body;

  let task;
  
  // Global administrators can assign any task
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', id)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', id)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*')
      .first();
  }

  if (!task) {
    throw createError('Task not found or access denied', 404);
  }

  if (assignee_id) {
    const assigneeAccess = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', task.project_id)
      .where('tm.user_id', assignee_id)
      .first();

    if (!assigneeAccess) {
      throw createError('User is not a member of the project team', 400);
    }
  }

  const [updatedTask] = await db('tasks')
    .where({ id })
    .update({ 
      assignee_id: assignee_id || null, 
      updated_at: new Date() 
    })
    .returning(['id', 'title', 'assignee_id', 'updated_at']);

  logger.info('Task assignment updated:', { taskId: id, assigneeId: assignee_id, userId });

  res.json({
    message: 'Task assignment updated successfully',
    task: updatedTask,
  });
});

export const bulkUpdateTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { task_ids, updates } = req.body;

  if (!Array.isArray(task_ids) || task_ids.length === 0) {
    throw createError('task_ids must be a non-empty array', 400);
  }

  const tasks = await db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .whereIn('t.id', task_ids)
    .where('tm.user_id', userId)
    .where('t.is_archived', false)
    .select('t.id', 't.project_id');

  if (tasks.length !== task_ids.length) {
    throw createError('Some tasks not found or access denied', 404);
  }

  const updatedTasks = await db('tasks')
    .whereIn('id', task_ids)
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .returning(['id', 'title', 'status', 'assignee_id']);

  logger.info('Bulk task update:', { taskIds: task_ids, updates, userId });

  res.json({
    message: 'Tasks updated successfully',
    tasks: updatedTasks,
  });
});