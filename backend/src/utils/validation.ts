import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).max(50).required(),
  last_name: Joi.string().min(1).max(50).required(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const teamSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
});

export const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).allow('').optional(),
  team_id: Joi.string().uuid().required(),
  status: Joi.string().valid('planning', 'active', 'on_hold', 'completed', 'cancelled').default('planning'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  start_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
});

export const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow('').optional(),
  project_id: Joi.string().uuid().required(),
  assignee_id: Joi.string().uuid().allow(null).optional(),
  status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done', 'cancelled').default('todo'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  type: Joi.string().valid('task', 'bug', 'feature', 'epic').default('task'),
  story_points: Joi.number().integer().min(1).max(100).optional(),
  time_estimate: Joi.number().integer().min(1).optional(),
  due_date: Joi.date().iso().optional(),
  parent_task_id: Joi.string().uuid().allow(null).optional(),
});

export const commentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  parent_comment_id: Joi.string().uuid().allow(null).optional(),
});

export const timeEntrySchema = Joi.object({
  task_id: Joi.string().uuid().required(),
  description: Joi.string().max(500).allow('').optional(),
  duration: Joi.number().integer().min(1).required(),
  date: Joi.date().iso().required(),
});

export const passwordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const passwordUpdateSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().optional(),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

export const taskFilterSchema = Joi.object({
  project_id: Joi.string().uuid().optional(),
  assignee_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  type: Joi.string().valid('task', 'bug', 'feature', 'epic').optional(),
  due_date_from: Joi.date().iso().optional(),
  due_date_to: Joi.date().iso().optional(),
  search: Joi.string().max(100).optional(),
}).concat(paginationSchema);