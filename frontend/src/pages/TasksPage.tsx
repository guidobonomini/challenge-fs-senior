import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import TaskListView from '../components/Tasks/TaskListView';
import TaskTable from '../components/Tasks/TaskTable';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { taskService } from '../services/tasks';
import { Task } from '../types';
import { PlusIcon, ViewColumnsIcon, Squares2X2Icon, QuestionMarkCircleIcon, DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import TaskModal from '../components/Tasks/TaskModal';
import KeyboardShortcutsModal from '../components/UI/KeyboardShortcutsModal';
import ExportModal from '../components/Export/ExportModal';
import { useKeyboardShortcuts, createTaskShortcuts } from '../hooks/useKeyboardShortcuts';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';

const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { projects, fetchProjects } = useProjectStore();
  const { tasks, isLoading, isLoadingMore, hasNextPage, fetchTasks, fetchMoreTasks, addTask, updateTaskFromSocket } = useTaskStore();
  const { token } = useAuthStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('kanban');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const searchRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchProjects({ limit: 100 });
    };
    loadData();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      // If no project is selected and we have a project from URL, use it
      if (!selectedProjectId && projectId) {
        setSelectedProjectId(projectId);
      }
      // Fetch tasks for the selected project (or all tasks if no project selected)
      fetchTasks(selectedProjectId || undefined, true);
    }
  }, [selectedProjectId, projects, fetchTasks, projectId]);

  // WebSocket setup for real-time task updates
  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect(token);

    // Join project rooms for all user projects to receive task creation events
    projects.forEach(project => {
      socketService.joinProject(project.id);
    });

    // Listen for task creation events
    const handleTaskCreated = (data: { task: any; project_id: string; created_by: any }) => {
      // Add task to store if it matches the current filter
      if (!selectedProjectId || data.project_id === selectedProjectId) {
        addTask(data.task);
      }
    };

    // Listen for task update events
    const handleTaskUpdated = (data: { task_id: string; task: any; changes: string[]; updated_by: any; project_id: string }) => {
      // Update task in store if it matches the current filter
      if (!selectedProjectId || data.project_id === selectedProjectId) {
        // Update the task in the store
        updateTaskFromSocket(data.task_id, data.task);
        
        // Show notification toast
        const user = data.updated_by;
        const userName = `${user.first_name} ${user.last_name}`;
        
        // Create a descriptive message based on changes
        let changeMessage = '';
        if (data.changes.includes('status')) {
          changeMessage = `changed status to ${data.task.status}`;
        } else if (data.changes.includes('assignee_id')) {
          changeMessage = 'changed assignee';
        } else if (data.changes.includes('priority')) {
          changeMessage = `changed priority to ${data.task.priority}`;
        } else {
          changeMessage = 'updated';
        }
        
        toast.success(
          `${userName} ${changeMessage} "${data.task.title || 'Unknown task'}"`,
          {
            duration: 4000,
            position: 'bottom-right',
            icon: '📝',
          }
        );
      }
    };

    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);

    return () => {
      projects.forEach(project => {
        socketService.leaveProject(project.id);
      });
      socketService.off('task_created', handleTaskCreated);
    };
  }, [token, projects, selectedProjectId, addTask]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'kanban') return 'list';
      if (prev === 'list') return 'table';
      return 'kanban';
    });
  };

  const focusSearch = () => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  const handleFiltersChange = async (filters: any, sort: any, page: number, limit: number) => {
    // Convert the filters to the format expected by the task service
    const queryParams = {
      ...filters,
      page,
      limit,
      project_id: selectedProjectId || undefined,
    };

    if (sort) {
      queryParams.sort_by = sort.field;
      queryParams.sort_order = sort.direction;
    }

    try {
      const response = await taskService.getTasks(queryParams);
      // Update the task store with the filtered results
      const { tasks: filteredTasks, pagination } = response;
      
      // For now, we'll directly update the tasks in the task store
      // This is a bit of a hack, but it works for the table view
      useTaskStore.setState({ 
        tasks: filteredTasks, 
        pagination,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching filtered tasks:', error);
    }
  };

  // Keyboard shortcuts setup
  const taskShortcuts = createTaskShortcuts({
    createTask: selectedProjectId ? handleCreateTask : undefined,
    toggleView: toggleViewMode,
    focusSearch: focusSearch,
    showHelp: () => setIsHelpModalOpen(true),
  });

  useKeyboardShortcuts({
    shortcuts: taskShortcuts,
    enableGlobal: true,
  });



  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tasks
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage tasks with drag-and-drop Kanban board or list view
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ViewColumnsIcon className="h-4 w-4 mr-1 inline" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4 mr-1 inline" />
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <TableCellsIcon className="h-4 w-4 mr-1 inline" />
                Table
              </button>
            </div>

            {/* Project Selector */}
            {projects.length > 0 && (
              <div className="min-w-48">
                <select
                  ref={searchRef}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white relative z-10"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Button */}
            {tasks.length > 0 && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                title="Export Tasks"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            )}

            {/* Keyboard Shortcuts Help Button */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Keyboard Shortcuts (Shift + ?)"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>

            {/* Create Task Button */}
            {selectedProjectId && (
              <button
                onClick={handleCreateTask}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-full">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create a project first to start managing tasks.
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard projectId={selectedProjectId || undefined} onEditTask={handleEditTask} />
        ) : viewMode === 'list' ? (
          <TaskListView
            tasks={tasks}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            selectedProjectId={selectedProjectId}
            onLoadMore={() => fetchMoreTasks(selectedProjectId || undefined)}
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTask}
          />
        ) : (
          <TaskTable
            tasks={tasks}
            loading={isLoading}
            onTaskClick={handleEditTask}
            onTaskEdit={handleEditTask}
            onFiltersChange={handleFiltersChange}
            availableUsers={[]} // You may want to fetch these from a user store
            availableProjects={projects.map(p => ({ id: p.id, name: p.name }))}
            showFilters={true}
            showActions={true}
          />
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        projectId={selectedProjectId}
      />
      
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        shortcuts={taskShortcuts}
      />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={tasks}
        type="tasks"
        title={`Export Tasks ${selectedProjectId ? `- ${projects.find(p => p.id === selectedProjectId)?.name || ''}` : ''}`}
      />
    </div>
  );
};

export default TasksPage;