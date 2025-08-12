import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { name, description, team_id, status, priority, start_date, due_date, color } = req.body;

  // Global administrators can create projects in any team
  let hasPermission = false;
  if (userRole === 'admin') {
    hasPermission = true;
  } else {
    const teamMember = await db('team_members')
      .where({ team_id, user_id: userId })
      .whereIn('role', ['admin', 'manager'])
      .first();
    hasPermission = !!teamMember;
  }

  if (!hasPermission) {
    throw createError('Access denied. Insufficient team permissions.', 403);
  }

  const [project] = await db('projects')
    .insert({
      id: uuidv4(),
      name,
      description,
      team_id,
      owner_id: userId,
      status: status || 'planning',
      priority: priority || 'medium',
      start_date,
      due_date,
      color: color || '#3B82F6',
      progress: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'name', 'description', 'team_id', 'owner_id', 'status', 'priority', 'start_date', 'due_date', 'color', 'progress', 'created_at']);

  logger.info('Project created:', { projectId: project.id, userId, teamId: team_id });

  res.status(201).json({
    message: 'Project created successfully',
    project,
  });
});

export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { 
    page = 1, 
    limit = 20, 
    team_id, 
    status, 
    priority, 
    search,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query;
  
  // Global administrators can see all projects
  if (userRole === 'admin') {
    query = db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .where('p.is_archived', false)
      .where('t.is_active', true);
  } else {
    query = db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .where('tm.user_id', userId)
      .where('p.is_archived', false)
      .where('t.is_active', true);
  }

  if (team_id) {
    query = query.where('p.team_id', team_id);
  }

  if (status) {
    query = query.where('p.status', status);
  }

  if (priority) {
    query = query.where('p.priority', priority);
  }

  if (search) {
    query = query.where(function() {
      this.where('p.name', 'ilike', `%${search}%`)
        .orWhere('p.description', 'ilike', `%${search}%`);
    });
  }

  const projects = await query
    .select(
      'p.id',
      'p.name',
      'p.description',
      'p.team_id',
      'p.owner_id',
      'p.status',
      'p.priority',
      'p.start_date',
      'p.due_date',
      'p.progress',
      'p.color',
      'p.created_at',
      'p.updated_at',
      't.name as team_name'
    )
    .orderBy(`p.${sort_by}`, sort_order as 'asc' | 'desc')
    .limit(Number(limit))
    .offset(offset);

  // Create a separate query for counting
  let countQuery;
  
  // Global administrators can count all projects
  if (userRole === 'admin') {
    countQuery = db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .where('p.is_archived', false)
      .where('t.is_active', true);
  } else {
    countQuery = db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .where('tm.user_id', userId)
      .where('p.is_archived', false)
      .where('t.is_active', true);
  }

  if (team_id) {
    countQuery = countQuery.where('p.team_id', team_id);
  }

  if (status) {
    countQuery = countQuery.where('p.status', status);
  }

  if (priority) {
    countQuery = countQuery.where('p.priority', priority);
  }

  if (search) {
    countQuery = countQuery.where(function() {
      this.where('p.name', 'ilike', `%${search}%`)
        .orWhere('p.description', 'ilike', `%${search}%`);
    });
  }

  const [{ count }] = await countQuery.countDistinct('p.id as count');

  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const taskStats = await db('tasks')
        .where('project_id', project.id)
        .where('is_archived', false)
        .select('status')
        .count('* as count')
        .groupBy('status');

      const totalTasks = taskStats.reduce((sum, stat) => sum + Number(stat.count), 0);
      const completedTasks = taskStats.find(stat => stat.status === 'done')?.count || 0;

      return {
        ...project,
        task_stats: {
          total: totalTasks,
          completed: Number(completedTasks),
          todo: Number(taskStats.find(stat => stat.status === 'todo')?.count || 0),
          in_progress: Number(taskStats.find(stat => stat.status === 'in_progress')?.count || 0),
          in_review: Number(taskStats.find(stat => stat.status === 'in_review')?.count || 0),
        },
      };
    })
  );

  res.json({
    projects: projectsWithStats,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(count),
      pages: Math.ceil(Number(count) / Number(limit)),
    },
  });
});

export const getProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  let project;
  
  // Global administrators can access any project
  if (userRole === 'admin') {
    project = await db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .where('p.id', id)
      .where('p.is_archived', false)
      .where('t.is_active', true)
      .select(
        'p.*',
        't.name as team_name',
        db.raw('null as user_team_role')
      )
      .first();
  } else {
    project = await db('projects as p')
      .join('teams as t', 'p.team_id', 't.id')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .where('p.id', id)
      .where('tm.user_id', userId)
      .where('p.is_archived', false)
      .where('t.is_active', true)
      .select(
        'p.*',
        't.name as team_name',
        'tm.role as user_team_role'
      )
      .first();
  }

  if (!project) {
    throw createError('Project not found or access denied', 404);
  }

  const owner = await db('users')
    .where('id', project.owner_id)
    .select('id', 'first_name', 'last_name', 'email', 'avatar_url')
    .first();

  const taskStats = await db('tasks')
    .where('project_id', id)
    .where('is_archived', false)
    .select('status')
    .count('* as count')
    .groupBy('status');

  const totalTasks = taskStats.reduce((sum, stat) => sum + Number(stat.count), 0);

  res.json({
    project: {
      ...project,
      owner,
      task_stats: {
        total: totalTasks,
        completed: Number(taskStats.find(stat => stat.status === 'done')?.count || 0),
        todo: Number(taskStats.find(stat => stat.status === 'todo')?.count || 0),
        in_progress: Number(taskStats.find(stat => stat.status === 'in_progress')?.count || 0),
        in_review: Number(taskStats.find(stat => stat.status === 'in_review')?.count || 0),
      },
    },
  });
});

export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;
  const updateData = req.body;

  let project;

  // Global administrators can update any project
  if (userRole === 'admin') {
    project = await db('projects')
      .where('id', id)
      .where('is_archived', false)
      .first();
  } else {
    // Regular users need team admin/manager permissions
    project = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', id)
      .where('tm.user_id', userId)
      .whereIn('tm.role', ['admin', 'manager'])
      .where('p.is_archived', false)
      .select('p.*')
      .first();
  }

  if (!project) {
    throw createError('Project not found or insufficient permissions', 404);
  }

  const [updatedProject] = await db('projects')
    .where({ id })
    .update({
      ...updateData,
      updated_at: new Date(),
    })
    .returning(['id', 'name', 'description', 'status', 'priority', 'start_date', 'due_date', 'progress', 'color', 'updated_at']);

  logger.info('Project updated:', { projectId: id, userId });

  res.json({
    message: 'Project updated successfully',
    project: updatedProject,
  });
});

export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  let project;

  // Global administrators can delete any project
  if (userRole === 'admin') {
    project = await db('projects')
      .where('id', id)
      .where('is_archived', false)
      .first();
  } else {
    // Regular users need team admin permissions
    project = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', id)
      .where('tm.user_id', userId)
      .where('tm.role', 'admin')
      .where('p.is_archived', false)
      .select('p.*')
      .first();
  }

  if (!project) {
    throw createError('Project not found or insufficient permissions', 404);
  }

  await db('projects')
    .where({ id })
    .update({ is_archived: true, updated_at: new Date() });

  logger.info('Project archived:', { projectId: id, userId });

  res.json({ message: 'Project archived successfully' });
});

export const getProjectMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const hasAccess = await db('projects as p')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('p.id', id)
    .where('tm.user_id', userId)
    .first();

  if (!hasAccess) {
    throw createError('Project not found or access denied', 404);
  }

  const members = await db('team_members as tm')
    .join('users as u', 'tm.user_id', 'u.id')
    .join('projects as p', 'tm.team_id', 'p.team_id')
    .where('p.id', id)
    .select(
      'u.id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.avatar_url',
      'tm.role as team_role'
    )
    .orderBy('u.first_name', 'asc');

  res.json({ members });
});

export const updateProjectProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { progress } = req.body;

  if (progress < 0 || progress > 100) {
    throw createError('Progress must be between 0 and 100', 400);
  }

  const project = await db('projects as p')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('p.id', id)
    .where('tm.user_id', userId)
    .whereIn('tm.role', ['admin', 'manager'])
    .where('p.is_archived', false)
    .select('p.*')
    .first();

  if (!project) {
    throw createError('Project not found or insufficient permissions', 404);
  }

  const [updatedProject] = await db('projects')
    .where({ id })
    .update({ progress, updated_at: new Date() })
    .returning(['id', 'progress', 'updated_at']);

  logger.info('Project progress updated:', { projectId: id, progress, userId });

  res.json({
    message: 'Project progress updated successfully',
    project: updatedProject,
  });
});