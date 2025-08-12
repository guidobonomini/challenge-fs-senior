import React from 'react';
import { Task } from '../../types';
import CompactViewerIndicator from '../Collaboration/CompactViewerIndicator';
import { useTaskViewers } from '../../hooks/useTaskViewers';
import { useAuthStore } from '../../store/authStore';

interface TaskListItemProps {
  task: Task;
  selectedProjectId?: string;
  onEditTask: (task: Task) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  selectedProjectId,
  onEditTask,
}) => {
  const { user } = useAuthStore();
  
  // Only track viewers for real tasks (not temporary ones during creation)
  const { viewers } = useTaskViewers({ 
    taskId: !task.id.startsWith('temp-') ? task.id : undefined, 
    enabled: !task.id.startsWith('temp-') 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer ${
        (task as any)._optimistic ? 'optimistic-update' : ''
      }`}
      onClick={() => !task.id.startsWith('temp-') && onEditTask(task)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {task.title}
          </h4>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
        </span>
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          {task.assignee && <span>@{task.assignee.first_name}</span>}
          {!selectedProjectId && task.project_name && (
            <span className="text-primary-600 dark:text-primary-400 font-medium">
              {task.project_name}
            </span>
          )}
          {user && (
            <CompactViewerIndicator 
              viewers={viewers} 
              currentUserId={user.id} 
            />
          )}
        </div>
        {task.due_date && (
          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default TaskListItem;