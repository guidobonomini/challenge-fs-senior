import { Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { aiCategorizationService } from '../services/aiCategorizationService';
import { logger } from '../utils/logger';
import db from '../config/database';

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await aiCategorizationService.getCategories();
  
  res.json({
    categories
  });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  // Only admins and managers can create categories
  if (userRole !== 'admin' && userRole !== 'manager') {
    throw createError('Insufficient permissions to create categories', 403);
  }

  const {
    name,
    description,
    color = '#6b7280',
    icon = 'tag',
    sort_order = 0
  } = req.body;

  if (!name) {
    throw createError('Category name is required', 400);
  }

  const category = await aiCategorizationService.createCategory({
    name,
    description,
    color,
    icon,
    is_system: false, // User-created categories are not system categories
    sort_order,
    is_active: true
  });

  logger.info('Category created by user:', { categoryId: category.id, userId });

  res.status(201).json({
    message: 'Category created successfully',
    category
  });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  // Only admins and managers can update categories
  if (userRole !== 'admin' && userRole !== 'manager') {
    throw createError('Insufficient permissions to update categories', 403);
  }

  const category = await aiCategorizationService.updateCategory(id, req.body);

  logger.info('Category updated by user:', { categoryId: id, userId });

  res.json({
    message: 'Category updated successfully',
    category
  });
});

export const analyzeTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Check if user has access to the task
  let task;
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

  const analysis = await aiCategorizationService.analyzeTaskContent(
    task.title,
    task.description,
    task.type
  );

  logger.info('Task analyzed for categorization:', { taskId: id, userId });

  res.json({
    analysis,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      current_category_id: task.category_id
    }
  });
});

export const categorizeTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { accept_suggestion = true } = req.body;

  // Check if user has access to the task
  let task;
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

  const result = await aiCategorizationService.categorizeTask(id, userId, accept_suggestion);

  logger.info('Task categorization completed:', { 
    taskId: id, 
    userId, 
    categorized: result.categorized 
  });

  res.json({
    message: result.categorized ? 'Task categorized successfully' : 'Task analyzed, review suggestions',
    ...result
  });
});

export const acceptSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { category_id, feedback } = req.body;

  if (!category_id) {
    throw createError('Category ID is required', 400);
  }

  // Check if user has access to the task
  let task;
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

  await aiCategorizationService.acceptSuggestion(id, category_id, userId, feedback);

  logger.info('AI suggestion accepted:', { taskId: id, categoryId: category_id, userId });

  res.json({
    message: 'AI suggestion accepted successfully'
  });
});

export const rejectSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { category_id, feedback } = req.body;

  if (!category_id) {
    throw createError('Category ID is required', 400);
  }

  // Check if user has access to the task
  let task;
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

  await aiCategorizationService.rejectSuggestion(id, category_id, userId, feedback);

  logger.info('AI suggestion rejected:', { taskId: id, categoryId: category_id, userId });

  res.json({
    message: 'AI suggestion rejected successfully'
  });
});

export const manualCategorization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { category_id } = req.body;

  // Check if user has access to the task
  let task;
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

  // If category_id is provided, verify it exists
  if (category_id) {
    const category = await db('task_categories')
      .where('id', category_id)
      .where('is_active', true)
      .first();
      
    if (!category) {
      throw createError('Invalid category ID', 400);
    }
  }

  await aiCategorizationService.manualCategorization(id, category_id || null, userId);

  logger.info('Task manually categorized:', { taskId: id, categoryId: category_id, userId });

  res.json({
    message: category_id 
      ? 'Task categorized successfully' 
      : 'Task category cleared successfully'
  });
});

export const bulkCategorizeProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { project_id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { accept_suggestion = true } = req.body;

  // Check if user has access to the project
  let projectAccess;
  if (userRole === 'admin') {
    projectAccess = await db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .where('p.id', project_id)
      .where('p.is_archived', false)
      .where('t.is_active', true)
      .first();
  } else {
    projectAccess = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', project_id)
      .where('tm.user_id', userId)
      .where('p.is_archived', false)
      .first();
  }

  if (!projectAccess) {
    throw createError('Project not found or access denied', 404);
  }

  const result = await aiCategorizationService.bulkCategorizeProject(
    project_id, 
    userId, 
    accept_suggestion
  );

  logger.info('Bulk categorization completed:', { 
    projectId: project_id, 
    userId,
    ...result 
  });

  res.json({
    message: 'Bulk categorization completed',
    ...result
  });
});

export const getCategorizationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { project_id } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // If project_id is specified, check access
  if (project_id) {
    let projectAccess;
    if (userRole === 'admin') {
      projectAccess = await db('projects as p')
        .join('teams as t', 'p.team_id', 't.id')
        .where('p.id', project_id)
        .where('p.is_archived', false)
        .where('t.is_active', true)
        .first();
    } else {
      projectAccess = await db('projects as p')
        .join('team_members as tm', 'p.team_id', 'tm.team_id')
        .where('p.id', project_id)
        .where('tm.user_id', userId)
        .where('p.is_archived', false)
        .first();
    }

    if (!projectAccess) {
      throw createError('Project not found or access denied', 404);
    }
  }

  const stats = await aiCategorizationService.getCategorizationStats(
    project_id as string
  );

  res.json({
    stats
  });
});

export const getTasksWithSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const {
    page = 1,
    limit = 25,
    project_id
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query;
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

  // Filter to only tasks with AI suggestions but no category
  query = query
    .whereNotNull('t.ai_suggested_categories')
    .whereNull('t.category_id');

  if (project_id) {
    query = query.where('t.project_id', project_id);
  }

  const tasks = await query
    .select(
      't.id',
      't.title',
      't.description',
      't.type',
      't.ai_suggested_categories',
      't.created_at',
      'p.name as project_name',
      'p.color as project_color'
    )
    .orderBy('t.created_at', 'desc')
    .limit(Number(limit))
    .offset(offset);

  // Get count for pagination
  let countQuery;
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

  countQuery = countQuery
    .whereNotNull('t.ai_suggested_categories')
    .whereNull('t.category_id');

  if (project_id) {
    countQuery = countQuery.where('t.project_id', project_id);
  }

  const [{ count }] = await countQuery.count('t.id as count');

  // Parse AI suggestions
  const tasksWithSuggestions = tasks.map(task => {
    let ai_suggestions = [];
    if (task.ai_suggested_categories) {
      try {
        ai_suggestions = JSON.parse(task.ai_suggested_categories);
      } catch (error) {
        console.warn('Failed to parse ai_suggested_categories for task:', task.id, error);
        ai_suggestions = [];
      }
    }
    
    return {
      ...task,
      ai_suggestions
    };
  });

  res.json({
    tasks: tasksWithSuggestions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(count),
      pages: Math.ceil(Number(count) / Number(limit))
    }
  });
});