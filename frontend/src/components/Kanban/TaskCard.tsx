import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Task, Priority } from '../../types';
import { format } from 'date-fns';
import CompactViewerIndicator from '../Collaboration/CompactViewerIndicator';
import { useTaskViewers } from '../../hooks/useTaskViewers';
import { useAuthStore } from '../../store/authStore';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEditTask?: (task: Task) => void;
}

const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false, onEditTask }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Only track viewers for real tasks (not temporary ones during creation)
  const { viewers } = useTaskViewers({ 
    taskId: !task.id.startsWith('temp-') ? task.id : undefined, 
    enabled: !task.id.startsWith('temp-') 
  });
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: isDragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isSortableDragging && !task.id.startsWith('temp-')) {
      if (onEditTask) {
        onEditTask(task);
      } else {
        navigate(`/tasks/${task.id}`);
      }
    }
  };

  const getOptimisticClasses = () => {
    if (!(task as any)._optimistic) return '';
    
    const classes = ['optimistic-update'];
    
    if (task.id.startsWith('temp-')) {
      classes.push('optimistic-creating');
    } else {
      classes.push('optimistic-updating');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${
        isSortableDragging || isDragging ? 'kanban-card-dragging' : ''
      } ${getOptimisticClasses()}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          {task.comment_count ? (
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span>{task.comment_count}</span>
            </div>
          ) : null}
          
          {task.attachment_count ? (
            <div className="flex items-center gap-1">
              <PaperClipIcon className="w-4 h-4" />
              <span>{task.attachment_count}</span>
            </div>
          ) : null}

          {task.estimated_hours && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}

          {user && (
            <CompactViewerIndicator 
              viewers={viewers} 
              currentUserId={user.id} 
            />
          )}
        </div>

        {task.due_date && (
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                {task.assignee.first_name[0]}{task.assignee.last_name[0]}
              </span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {task.assignee.first_name} {task.assignee.last_name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;