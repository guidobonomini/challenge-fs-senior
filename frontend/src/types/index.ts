export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'member';
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_role?: 'admin' | 'manager' | 'member';
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'member';
  joined_at: string;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  team_id: string;
  owner_id: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  due_date?: string;
  progress: number;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  team_name?: string;
  owner?: User;
  task_stats?: TaskStats;
}

export interface TaskStats {
  total: number;
  completed: number;
  todo: number;
  in_progress: number;
  in_review: number;
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
  due_date?: string;
  position: number;
  parent_task_id?: string;
  custom_fields?: Record<string, any>;
  is_archived: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  assignee?: User;
  reporter?: User;
  project_name?: string;
  project_color?: string;
  team_id?: string;
  team_name?: string;
  comment_count?: number;
  attachment_count?: number;
  comments?: Comment[];
  attachments?: Attachment[];
  time_entries?: TimeEntry[];
  total_time_spent?: number;
  
  // Optimistic update flag
  _optimistic?: boolean;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  task_id?: string;
  comment_id?: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  file_url?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_updated' | 'task_commented' | 'task_completed' | 'project_updated' | 'team_invitation' | 'deadline_reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  is_email_sent: boolean;
  related_task_id?: string;
  related_project_id?: string;
  triggered_by?: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description?: string;
  duration: number; // in seconds
  started_at: string;
  ended_at?: string;
  is_running: boolean;
  date: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string; }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TaskFilters extends PaginationParams {
  project_id?: string;
  assignee_id?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  type?: Task['type'];
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

export interface ProjectFilters extends PaginationParams {
  team_id?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  search?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  team_id: string;
  status?: Project['status'];
  priority?: Project['priority'];
  start_date?: string;
  due_date?: string;
  color?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  type?: Task['type'];
  story_points?: number;
  time_estimate?: number;
  due_date?: string;
  parent_task_id?: string;
}

export interface CreateCommentData {
  content: string;
  parent_comment_id?: string;
}

export interface UpdateTaskPositionData {
  status: Task['status'];
  position: number;
}

export interface BulkUpdateTasksData {
  task_ids: string[];
  updates: Partial<Pick<Task, 'status' | 'priority' | 'assignee_id'>>;
}

export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  
  // Project events
  join_project: (projectId: string) => void;
  leave_project: (projectId: string) => void;
  user_joined_project: (data: { user: User; project_id: string }) => void;
  user_left_project: (data: { user: User; project_id: string }) => void;
  project_updated: (data: { project_id: string; updated_by: User }) => void;
  
  // Task events
  join_task: (taskId: string) => void;
  leave_task: (taskId: string) => void;
  user_viewing_task: (data: { user: User; task_id: string }) => void;
  user_stopped_viewing_task: (data: { user: User; task_id: string }) => void;
  task_status_changed: (data: { task_id: string; new_status: string; changed_by: User }) => void;
  task_commented: (data: { task_id: string; comment_id: string; commented_by: User }) => void;
  task_typing: (data: { task_id: string; is_typing: boolean }) => void;
  user_typing: (data: { user: User; task_id: string; is_typing: boolean }) => void;
  
  // Notification events
  new_notification: (notification: Notification) => void;
}

export interface Theme {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export interface AppError {
  message: string;
  status?: number;
  details?: Array<{ field: string; message: string; }>;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskType = 'task' | 'bug' | 'feature' | 'epic';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'manager' | 'member';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;