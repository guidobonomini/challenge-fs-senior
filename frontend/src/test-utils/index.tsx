import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { User, Task, Project, Team, TaskStatus, Priority } from '../types';

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'member',
  is_active: true,
  avatar_url: undefined,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
  email_verified: true,
  ...overrides,
});

export const createMockAdminUser = (overrides: Partial<User> = {}): User => ({
  ...createMockUser(overrides),
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  ...overrides,
});

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  project_id: 'project-1',
  assignee_id: 'user-1',
  reporter_id: 'admin-1',
  status: 'todo' as TaskStatus,
  priority: 'medium' as Priority,
  type: 'task',
  story_points: 3,
  time_estimate: 7200, // 2 hours in seconds
  time_spent: 0,
  due_date: '2022-01-15T00:00:00Z',
  position: 0,
  parent_task_id: undefined,
  is_archived: false,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
  started_at: undefined,
  completed_at: undefined,
  project_name: 'Test Project',
  project_color: '#3B82F6',
  assignee: {
    id: 'user-1',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    avatar_url: undefined,
    role: 'member' as const,
    is_active: true,
    email_verified: true,
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2022-01-01T00:00:00Z',
  },
  reporter: {
    id: 'admin-1',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    avatar_url: undefined,
    role: 'admin' as const,
    is_active: true,
    email_verified: true,
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2022-01-01T00:00:00Z',
  },
  comment_count: 0,
  attachment_count: 0,
  ...overrides,
});

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project description',
  team_id: 'team-1',
  owner_id: 'admin-1',
  status: 'active' as const,
  priority: 'medium' as const,
  progress: 0,
  color: '#3B82F6',
  is_archived: false,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
  team_name: 'Test Team',
  ...overrides,
});

export const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Test Team',
  description: 'Test team description',
  owner_id: 'admin-1',
  is_active: true,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
  member_role: 'member',
  members: [],
  ...overrides,
});

// Mock store states
export const createMockAuthState = (overrides: any = {}) => ({
  user: createMockUser(),
  token: 'mock-token',
  isLoading: false,
  error: null,
  ...overrides,
});

export const createMockTaskState = (overrides: any = {}) => ({
  tasks: [createMockTask()],
  currentTask: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasNextPage: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  },
  filters: {},
  ...overrides,
});

export const createMockProjectState = (overrides: any = {}) => ({
  projects: [createMockProject()],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  },
  ...overrides,
});

export const createMockTeamState = (overrides: any = {}) => ({
  teams: [createMockTeam()],
  currentTeam: null,
  currentTeamMembers: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    pages: 1,
  },
  ...overrides,
});

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

function createWrapper({ initialEntries = ['/'], queryClient }: CustomRenderOptions = {}) {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries, queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: createWrapper({ initialEntries, queryClient }),
    ...renderOptions,
  });
}

// Mock store utilities
export const mockZustandStore = (initialState: any) => {
  const store = jest.fn(() => initialState) as any;
  store.getState = jest.fn(() => initialState);
  store.setState = jest.fn((partial: any) => {
    Object.assign(initialState, typeof partial === 'function' ? partial(initialState) : partial);
  });
  store.subscribe = jest.fn();
  store.destroy = jest.fn();
  return store;
};

// Mock axios responses
export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const createMockApiError = (message: string, status = 400) => ({
  response: {
    data: { error: message },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Error',
    headers: {},
    config: {},
  },
  isAxiosError: true,
  message,
});

// Helper functions
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

export const mockSessionStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Test IDs for consistent element selection
export const testIds = {
  // Auth
  loginForm: 'login-form',
  registerForm: 'register-form',
  emailInput: 'email-input',
  passwordInput: 'password-input',
  submitButton: 'submit-button',
  
  // Navigation
  sidebar: 'sidebar',
  header: 'header',
  userMenu: 'user-menu',
  logoutButton: 'logout-button',
  
  // Tasks
  taskList: 'task-list',
  taskCard: 'task-card',
  taskModal: 'task-modal',
  createTaskButton: 'create-task-button',
  editTaskButton: 'edit-task-button',
  deleteTaskButton: 'delete-task-button',
  taskTitle: 'task-title',
  taskDescription: 'task-description',
  taskStatus: 'task-status',
  taskPriority: 'task-priority',
  
  // Kanban
  kanbanBoard: 'kanban-board',
  kanbanColumn: 'kanban-column',
  todoColumn: 'todo-column',
  inProgressColumn: 'in-progress-column',
  inReviewColumn: 'in-review-column',
  doneColumn: 'done-column',
  
  // Projects
  projectList: 'project-list',
  projectCard: 'project-card',
  projectModal: 'project-modal',
  createProjectButton: 'create-project-button',
  
  // Teams
  teamList: 'team-list',
  teamCard: 'team-card',
  teamModal: 'team-modal',
  createTeamButton: 'create-team-button',
  
  // UI Components
  modal: 'modal',
  modalClose: 'modal-close',
  loadingSpinner: 'loading-spinner',
  errorMessage: 'error-message',
  successMessage: 'success-message',
  
  // Forms
  formInput: 'form-input',
  formTextarea: 'form-textarea',
  formSelect: 'form-select',
  formButton: 'form-button',
  formError: 'form-error',
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };