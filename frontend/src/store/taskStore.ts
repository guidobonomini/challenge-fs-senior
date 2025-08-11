import { create } from 'zustand';
import { Task, CreateTaskData, TaskStatus } from '../types';
import { taskService } from '../services/tasks';
import { toast } from 'react-hot-toast';

interface TaskState {
  // State
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    search?: string;
  };

  // Actions
  fetchTasks: (projectId?: string, reset?: boolean) => Promise<void>;
  fetchMoreTasks: (projectId?: string) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: Partial<CreateTaskData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskPosition: (id: string, status: TaskStatus, position: number) => Promise<void>;
  assignTask: (id: string, assigneeId: string | null) => Promise<void>;
  addTask: (task: Task) => void;
  updateTaskFromSocket: (taskId: string, updates: Partial<Task>) => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearCurrentTask: () => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  currentTask: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasNextPage: true,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},

  // Actions
  fetchTasks: async (projectId?: string, reset: boolean = true) => {
    const state = get();
    const currentPage = reset ? 1 : state.pagination.page;
    
    set({ 
      isLoading: reset,
      isLoadingMore: !reset,
      error: null,
      ...(reset && { 
        tasks: [],
        pagination: { ...state.pagination, page: 1 },
        hasNextPage: true 
      })
    });

    try {
      const response = await taskService.getTasks({
        project_id: projectId,
        ...state.filters,
        page: currentPage,
        limit: state.pagination.limit,
      });
      
      const newTasks = response.tasks || [];
      const pagination = response.pagination || state.pagination;
      
      set((state) => ({
        tasks: reset ? newTasks : [...state.tasks, ...newTasks],
        pagination: {
          ...pagination,
          page: currentPage,
        },
        hasNextPage: pagination.page < pagination.pages,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch tasks';
      set({
        error: errorMessage,
        isLoading: false,
        isLoadingMore: false,
      });
    }
  },

  fetchMoreTasks: async (projectId?: string) => {
    const state = get();
    if (!state.hasNextPage || state.isLoadingMore) return;

    const nextPage = state.pagination.page + 1;
    set(currentState => ({
      ...currentState,
      pagination: { ...currentState.pagination, page: nextPage }
    }));
    
    await get().fetchTasks(projectId, false);
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.getTask(id);
      set({
        currentTask: response.task || null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch task';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  createTask: async (data: CreateTaskData) => {
    // Optimistic update: Create temporary task immediately
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      project_id: data.project_id,
      assignee_id: data.assignee_id,
      reporter_id: '', // Will be set by backend
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      type: data.type || 'task',
      story_points: data.story_points,
      time_estimate: data.time_estimate,
      time_spent: 0,
      due_date: data.due_date,
      position: 0,
      parent_task_id: data.parent_task_id,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project_name: '',
      project_color: '',
      assignee: undefined,
      reporter: undefined,
      _optimistic: true, // Flag to identify optimistic updates
    };

    // Add optimistic task to state immediately
    set((state) => ({
      tasks: [optimisticTask, ...state.tasks],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await taskService.createTask(data);
      
      // Replace optimistic task with real one
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === optimisticTask.id && response.data?.task 
            ? { ...response.data.task, _optimistic: false }
            : task
        ),
        isLoading: false,
      }));

      toast.success('Task created successfully');
    } catch (error: any) {
      // Remove optimistic task on error
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== optimisticTask.id),
        error: error.response?.data?.error || 'Failed to create task',
        isLoading: false,
      }));
      toast.error('Failed to create task');
      throw error;
    }
  },

  updateTask: async (id: string, data: Partial<CreateTaskData>) => {
    // Store original task state for potential rollback
    const originalState = get();
    const originalTask = originalState.tasks.find(task => task.id === id);
    
    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Optimistic update: Update task immediately
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === id 
          ? { ...task, ...data, updated_at: new Date().toISOString(), _optimistic: true }
          : task
      ),
      currentTask: state.currentTask?.id === id 
        ? { ...state.currentTask, ...data, updated_at: new Date().toISOString(), _optimistic: true }
        : state.currentTask,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await taskService.updateTask(id, data);
      
      // Replace optimistic update with server response
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id && response.data?.task 
            ? { ...response.data.task, _optimistic: false } 
            : task
        ),
        currentTask: state.currentTask?.id === id && response.data?.task
          ? { ...response.data.task, _optimistic: false }
          : state.currentTask,
        isLoading: false,
      }));

      toast.success('Task updated successfully');
    } catch (error: any) {
      // Rollback optimistic update on error
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...originalTask, _optimistic: false } : task
        ),
        currentTask: state.currentTask?.id === id 
          ? { ...originalTask, _optimistic: false }
          : state.currentTask,
        error: error.response?.data?.error || 'Failed to update task',
        isLoading: false,
      }));
      toast.error('Failed to update task');
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    // Store original task for potential rollback
    const originalState = get();
    const taskToDelete = originalState.tasks.find(task => task.id === id);
    
    if (!taskToDelete) {
      throw new Error('Task not found');
    }

    // Optimistic update: Remove task immediately
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
      isLoading: true,
      error: null,
    }));

    try {
      await taskService.deleteTask(id);
      
      // Confirm deletion (task already removed)
      set({ isLoading: false });
      toast.success('Task deleted successfully');
    } catch (error: any) {
      // Rollback: Restore deleted task
      const taskIndex = originalState.tasks.findIndex(task => task.id === id);
      set((state) => ({
        tasks: [
          ...state.tasks.slice(0, taskIndex >= 0 ? taskIndex : state.tasks.length),
          { ...taskToDelete, _optimistic: false },
          ...state.tasks.slice(taskIndex >= 0 ? taskIndex : state.tasks.length),
        ],
        currentTask: originalState.currentTask?.id === id ? originalState.currentTask : state.currentTask,
        error: error.response?.data?.error || 'Failed to delete task',
        isLoading: false,
      }));
      toast.error('Failed to delete task');
      throw error;
    }
  },

  updateTaskPosition: async (id: string, status: TaskStatus, position: number) => {
    // Optimistic update
    const oldTasks = get().tasks;
    const taskToMove = oldTasks.find(t => t.id === id);
    if (!taskToMove) return;

    // Update local state immediately
    const updatedTasks = oldTasks.map(task => 
      task.id === id ? { ...task, status, position } : task
    );
    set({ tasks: updatedTasks });

    try {
      await taskService.updateTaskPosition(id, { status, position });
    } catch (error: any) {
      // Revert on error
      set({ tasks: oldTasks });
      const errorMessage = error.response?.data?.error || 'Failed to update task position';
      set({ error: errorMessage });
      toast.error(errorMessage);
    }
  },

  assignTask: async (id: string, assigneeId: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.assignTask(id, assigneeId);
      
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, assignee_id: assigneeId || undefined } : task
        ),
        isLoading: false,
      }));

      toast.success('Task assignment updated');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to assign task';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
  },

  updateTaskFromSocket: (taskId: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      ),
      currentTask: state.currentTask?.id === taskId 
        ? { ...state.currentTask, ...updates, updated_at: new Date().toISOString() }
        : state.currentTask,
    }));
  },

  setFilters: (filters: Partial<TaskState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearCurrentTask: () => {
    set({ currentTask: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));