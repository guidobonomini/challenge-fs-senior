import { Response } from 'express';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const getTaskStatusAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { project_id, team_id } = req.query;

  let query = db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .where('t.is_archived', false)
    .where('p.is_archived', false);

  // Apply access control
  if (userRole !== 'admin') {
    query = query
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId);
  }

  // Apply filters
  if (project_id) {
    query = query.where('t.project_id', project_id);
  }
  if (team_id) {
    query = query.where('p.team_id', team_id);
  }

  const results = await query
    .select('t.status')
    .groupBy('t.status')
    .count('* as count');

  // Initialize all statuses with 0
  const statusData = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
    cancelled: 0
  };

  // Populate with actual data
  results.forEach(row => {
    if (row.status in statusData) {
      statusData[row.status as keyof typeof statusData] = Number(row.count);
    }
  });

  res.json({
    success: true,
    data: statusData
  });
});

export const getTaskProgressAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { project_id, team_id, time_range = 'month' } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (time_range) {
  case 'week':
    startDate.setDate(endDate.getDate() - 7);
    break;
  case 'quarter':
    startDate.setMonth(endDate.getMonth() - 3);
    break;
  case 'year':
    startDate.setFullYear(endDate.getFullYear() - 1);
    break;
  default: // month
    startDate.setMonth(endDate.getMonth() - 1);
  }

  let baseQuery = db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .where('t.is_archived', false)
    .where('p.is_archived', false)
    .where('t.created_at', '>=', startDate)
    .where('t.created_at', '<=', endDate);

  // Apply access control
  if (userRole !== 'admin') {
    baseQuery = baseQuery
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId);
  }

  // Apply filters
  if (project_id) {
    baseQuery = baseQuery.where('t.project_id', project_id);
  }
  if (team_id) {
    baseQuery = baseQuery.where('p.team_id', team_id);
  }

  // Get daily progress data
  const progressData = await baseQuery.clone()
    .select(
      db.raw('DATE(t.created_at) as date'),
      db.raw('COUNT(*) as daily_created'),
      db.raw('SUM(CASE WHEN t.status = \'done\' THEN 1 ELSE 0 END) as daily_completed')
    )
    .groupBy(db.raw('DATE(t.created_at)'))
    .orderBy('date', 'asc');

  // Build cumulative data
  const result: any[] = [];
  let totalTasks = 0;
  let completedTasks = 0;

  progressData.forEach(row => {
    totalTasks += Number(row.daily_created);
    completedTasks += Number(row.daily_completed);
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    result.push({
      date: row.date,
      completed: completedTasks,
      total: totalTasks,
      completionRate: Math.round(completionRate * 10) / 10
    });
  });

  res.json({
    success: true,
    data: result
  });
});

export const getTeamWorkloadAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { teamId } = req.params;

  // Verify team access
  if (userRole !== 'admin') {
    const teamAccess = await db('team_members')
      .where('team_id', teamId)
      .where('user_id', userId)
      .first();

    if (!teamAccess) {
      throw createError('Team not found or access denied', 404);
    }
  }

  const workloadData = await db('team_members as tm')
    .join('users as u', 'tm.user_id', 'u.id')
    .leftJoin('tasks as t', function() {
      this.on('t.assignee_id', 'u.id')
        .andOn('t.is_archived', db.raw('false'));
    })
    .leftJoin('projects as p', 't.project_id', 'p.id')
    .where('tm.team_id', teamId)
    .where('u.is_active', true)
    .select(
      'u.id as user_id',
      'u.first_name',
      'u.last_name',
      db.raw('COUNT(t.id) as total_tasks'),
      db.raw('SUM(CASE WHEN t.status IN (\'todo\', \'in_progress\', \'in_review\') THEN 1 ELSE 0 END) as active_tasks'),
      db.raw('SUM(CASE WHEN t.priority IN (\'high\', \'urgent\') THEN 1 ELSE 0 END) as high_priority_tasks'),
      db.raw('SUM(CASE WHEN t.due_date < NOW() AND t.status != \'done\' THEN 1 ELSE 0 END) as overdue_tasks')
    )
    .groupBy('u.id', 'u.first_name', 'u.last_name');

  const result = workloadData.map(row => ({
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    total_tasks: Number(row.total_tasks),
    active_tasks: Number(row.active_tasks),
    high_priority_tasks: Number(row.high_priority_tasks),
    overdue_tasks: Number(row.overdue_tasks),
    workload_score: Number(row.active_tasks) + (Number(row.high_priority_tasks) * 2) + (Number(row.overdue_tasks) * 3)
  }));

  res.json({
    success: true,
    data: result
  });
});

export const getVelocityAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { teamId } = req.params;
  const { period_type = 'month', periods = 6 } = req.query;

  // Verify team access
  if (userRole !== 'admin') {
    const teamAccess = await db('team_members')
      .where('team_id', teamId)
      .where('user_id', userId)
      .first();

    if (!teamAccess) {
      throw createError('Team not found or access denied', 404);
    }
  }

  // Calculate periods based on type
  const periodsArray: any[] = [];
  const endDate = new Date();
  
  for (let i = Number(periods) - 1; i >= 0; i--) {
    const periodEnd = new Date(endDate);
    const periodStart = new Date(endDate);
    
    switch (period_type) {
    case 'week':
      periodStart.setDate(endDate.getDate() - (i + 1) * 7);
      periodEnd.setDate(endDate.getDate() - i * 7);
      break;
    case 'month':
      periodStart.setMonth(endDate.getMonth() - (i + 1));
      periodEnd.setMonth(endDate.getMonth() - i);
      break;
    default:
      periodStart.setMonth(endDate.getMonth() - (i + 1));
      periodEnd.setMonth(endDate.getMonth() - i);
    }
    
    periodsArray.push({
      start: periodStart,
      end: periodEnd,
      label: period_type === 'week' 
        ? `Week ${i + 1}` 
        : `${periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    });
  }

  const velocityData = await Promise.all(periodsArray.map(async (period) => {
    const tasksQuery = db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .where('p.team_id', teamId)
      .where('t.is_archived', false)
      .where('t.created_at', '>=', period.start)
      .where('t.created_at', '<=', period.end);

    const [totalTasks, completedTasks] = await Promise.all([
      tasksQuery.clone().count('* as count').first(),
      tasksQuery.clone().where('t.status', 'done').count('* as count').first()
    ]);

    // Get estimated hours for story points calculation
    const estimatedHours = await tasksQuery.clone()
      .where('t.status', 'done')
      .sum('t.estimated_hours as total_hours')
      .first();

    return {
      period: period.label,
      planned: Number(totalTasks?.count || 0),
      completed: Number(completedTasks?.count || 0),
      storyPoints: Number(estimatedHours?.total_hours || 0)
    };
  }));

  res.json({
    success: true,
    data: velocityData
  });
});

export const getPriorityDistributionAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { project_id, team_id } = req.query;

  let query = db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .where('t.is_archived', false)
    .where('p.is_archived', false);

  // Apply access control
  if (userRole !== 'admin') {
    query = query
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId);
  }

  // Apply filters
  if (project_id) {
    query = query.where('t.project_id', project_id);
  }
  if (team_id) {
    query = query.where('p.team_id', team_id);
  }

  const results = await query
    .select('t.priority')
    .groupBy('t.priority')
    .count('* as count');

  // Initialize all priorities with 0
  const priorityData = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0
  };

  // Populate with actual data (map critical to urgent for consistency)
  results.forEach(row => {
    const priority = row.priority === 'critical' ? 'urgent' : row.priority;
    if (priority in priorityData) {
      priorityData[priority as keyof typeof priorityData] = Number(row.count);
    }
  });

  res.json({
    success: true,
    data: priorityData
  });
});

export const getTimeTrackingAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { project_id, team_id, time_range = 'month' } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (time_range) {
  case 'week':
    startDate.setDate(endDate.getDate() - 7);
    break;
  case 'quarter':
    startDate.setMonth(endDate.getMonth() - 3);
    break;
  default: // month
    startDate.setMonth(endDate.getMonth() - 1);
  }

  let query = db('time_entries as te')
    .join('tasks as t', 'te.task_id', 't.id')
    .join('projects as p', 't.project_id', 'p.id')
    .join('users as u', 'te.user_id', 'u.id')
    .where('te.start_time', '>=', startDate)
    .where('te.start_time', '<=', endDate)
    .where('t.is_archived', false);

  // Apply access control
  if (userRole !== 'admin') {
    query = query
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('tm.user_id', userId);
  }

  // Apply filters
  if (project_id) {
    query = query.where('t.project_id', project_id);
  }
  if (team_id) {
    query = query.where('p.team_id', team_id);
  }

  const timeData = await query
    .select(
      db.raw('DATE(te.start_time) as date'),
      db.raw('SUM(te.duration) as total_minutes'),
      db.raw('COUNT(DISTINCT te.user_id) as active_users'),
      db.raw('COUNT(te.id) as total_entries')
    )
    .groupBy(db.raw('DATE(te.start_time)'))
    .orderBy('date', 'asc');

  const result = timeData.map(row => ({
    date: row.date,
    total_hours: Math.round(Number(row.total_minutes) / 60 * 10) / 10,
    active_users: Number(row.active_users),
    total_entries: Number(row.total_entries)
  }));

  res.json({
    success: true,
    data: result
  });
});