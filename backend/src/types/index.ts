import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'member';
  is_active: boolean;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'member';
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  team_id: string;
  owner_id: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: Date;
  due_date?: Date;
  progress: number;
  color: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  reporter_id: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'bug' | 'feature' | 'epic';
  story_points?: number;
  time_estimate?: number;
  time_spent: number;
  due_date?: Date;
  position: number;
  parent_task_id?: string;
  custom_fields?: any;
  is_archived: boolean;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_updated' | 'task_commented' | 'task_completed' | 'project_updated' | 'team_invitation' | 'deadline_reminder';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  is_email_sent: boolean;
  related_task_id?: string;
  related_project_id?: string;
  triggered_by?: string;
  created_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'unassign' | 'comment' | 'upload' | 'status_change' | 'login' | 'logout';
  entity_type: 'user' | 'team' | 'project' | 'task' | 'comment' | 'attachment';
  entity_id?: string;
  description: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description?: string;
  duration: number;
  started_at: Date;
  ended_at?: Date;
  is_running: boolean;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: User;
}