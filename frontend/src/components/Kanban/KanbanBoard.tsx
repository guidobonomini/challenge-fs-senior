import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import LoadingSpinner from '../UI/LoadingSpinner';

const TASK_STATUSES: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'in_review', title: 'In Review', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900' },
];

interface KanbanBoardProps {
  projectId?: string;
  onEditTask?: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, onEditTask }) => {
  const {
    tasks,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    fetchTasks,
    fetchMoreTasks,
    updateTaskPosition,
    clearError,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks(projectId, true); // Reset pagination when projectId changes
  }, [fetchTasks, projectId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping on a column (droppable area)
    const targetStatus = TASK_STATUSES.find(status => status.id === overId)?.id;
    
    if (targetStatus) {
      if (targetStatus !== activeTask.status) {
        // Moving to a different column
        const targetTasks = getTasksByStatus(targetStatus);
        const newPosition = targetTasks.length;
        updateTaskPosition(activeId, targetStatus, newPosition);
      }
      return;
    }

    // Check if dropping on another task
    const targetTask = tasks.find(t => t.id === overId);
    if (targetTask) {
      if (targetTask.status !== activeTask.status) {
        // Moving to a different column by dropping on a task
        const targetTasks = getTasksByStatus(targetTask.status);
        const targetIndex = targetTasks.findIndex(t => t.id === overId);
        updateTaskPosition(activeId, targetTask.status, targetIndex);
      } else {
        // Reordering within the same column
        const columnTasks = getTasksByStatus(activeTask.status);
        const activeIndex = columnTasks.findIndex(t => t.id === activeId);
        const targetIndex = columnTasks.findIndex(t => t.id === overId);

        if (activeIndex !== targetIndex) {
          // Calculate the new position based on target index
          const newPosition = targetIndex;
          updateTaskPosition(activeId, activeTask.status, newPosition);
        }
      }
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kanban Board
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          + Add Task
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md">
          <p className="text-error-700 dark:text-error-400 text-sm">{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {TASK_STATUSES.map((status) => {
            const columnTasks = getTasksByStatus(status.id);
            
            return (
              <SortableContext
                key={status.id}
                items={columnTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={status.id}
                  title={status.title}
                  color={status.color}
                  tasks={columnTasks}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  hasNextPage={hasNextPage}
                  onLoadMore={() => fetchMoreTasks(projectId)}
                  onEditTask={onEditTask}
                />
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="kanban-card-dragging">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};

export default KanbanBoard;