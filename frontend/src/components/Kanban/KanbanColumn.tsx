import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../types';
import TaskCard from './TaskCard';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onEditTask?: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  tasks,
  isLoading,
  isLoadingMore,
  hasNextPage,
  onLoadMore,
  onEditTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const { loadingRef } = useInfiniteScroll({
    hasNextPage,
    isLoading: isLoadingMore,
    onLoadMore,
    threshold: 0.5,
    rootMargin: '50px',
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column min-w-72 w-80 flex flex-col ${color} ${
        isOver ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Task List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 min-h-24 pb-4">
          {isLoading && tasks.length === 0 ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : tasks.length > 0 ? (
            <>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEditTask={onEditTask} />
              ))}
              
              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={loadingRef} className="py-4">
                  {isLoadingMore && (
                    <div className="flex justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No tasks in {title.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;