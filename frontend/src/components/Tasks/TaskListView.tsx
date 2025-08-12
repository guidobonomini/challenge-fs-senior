import React from 'react';
import { Task } from '../../types';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import LoadingSpinner from '../UI/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import TaskListItem from './TaskListItem';

interface TaskListViewProps {
  tasks: Task[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  selectedProjectId?: string;
  onLoadMore: () => void;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  isLoading,
  isLoadingMore,
  hasNextPage,
  selectedProjectId,
  onLoadMore,
  onEditTask,
  onCreateTask,
}) => {
  const { loadingRef } = useInfiniteScroll({
    hasNextPage,
    isLoading: isLoadingMore,
    onLoadMore,
    threshold: 0.5,
    rootMargin: '100px',
  });


  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Tasks ({tasks.length}) {!selectedProjectId && '- All Projects'}
        </h3>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Tasks Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {selectedProjectId 
              ? "Get started by creating your first task for this project."
              : "No tasks found across all your projects. Select a specific project to create tasks."
            }
          </p>
          {selectedProjectId && (
            <button
              onClick={onCreateTask}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              selectedProjectId={selectedProjectId}
              onEditTask={onEditTask}
            />
          ))}
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadingRef} className="py-8">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskListView;