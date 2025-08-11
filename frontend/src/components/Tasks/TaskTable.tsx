import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  EyeIcon,
  PencilIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Task, Priority, TaskStatus, TaskType } from '../../types';
import TaskFilters, { TaskFilterOptions } from '../Filters/TaskFilters';
import Pagination, { PaginationData } from '../Pagination/Pagination';
import SortableColumn, { SortConfig } from '../Sorting/SortableColumn';
import AssignmentIndicator from '../Assignment/AssignmentIndicator';
import { useTableData } from '../../hooks/useTableData';
import LoadingSpinner from '../UI/LoadingSpinner';

interface TaskTableProps {
  tasks: Task[];
  loading?: boolean;
  pagination?: PaginationData;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onFiltersChange?: (filters: TaskFilterOptions, sort: SortConfig | null, page: number, limit: number) => void;
  availableUsers?: Array<{ id: string; first_name: string; last_name: string; }>;
  availableProjects?: Array<{ id: string; name: string; }>;
  showFilters?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading = false,
  pagination: externalPagination,
  onTaskClick,
  onTaskEdit,
  onFiltersChange,
  availableUsers = [],
  availableProjects = [],
  showFilters = true,
  showActions = true,
  compact = false,
  className = '',
}) => {
  const {
    filters,
    sort,
    pagination,
    updateFilters,
    clearFilters,
    updateSort,
    updatePagination,
    setPage,
    setLimit,
    hasActiveFilters,
    queryParams,
  } = useTableData({
    defaultLimit: 25,
    syncWithUrl: true,
    urlPrefix: 'task_',
  });

  // Update internal pagination when external pagination changes
  useEffect(() => {
    if (externalPagination) {
      updatePagination(externalPagination);
    }
  }, [externalPagination, updatePagination]);

  // Notify parent of changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters, sort, pagination.page, pagination.limit);
    }
  }, [filters, sort, pagination.page, pagination.limit, onFiltersChange]);

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    updateSort(field, direction);
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: TaskType): string => {
    switch (type) {
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'feature':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'epic':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const formatTimeEstimate = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${remainingMinutes}m`;
  };

  const formatCreatedDate = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Calculate columns to show based on compact mode and available space
  const visibleColumns = useMemo(() => {
    const base = ['title', 'status', 'priority'];
    
    if (!compact) {
      base.push('type', 'assignee', 'project', 'due_date', 'created_at');
    }
    
    if (showActions) {
      base.push('actions');
    }
    
    return base;
  }, [compact, showActions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          availableUsers={availableUsers}
          availableProjects={availableProjects}
        />
      )}

      {/* Results summary */}
      {(hasActiveFilters || tasks.length > 0) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {hasActiveFilters && (
              <span>
                Found {pagination.total} tasks matching your filters
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length === 0 && !loading ? 'No tasks found' : ''}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                {visibleColumns.includes('title') && (
                  <SortableColumn
                    title="Title"
                    field="title"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-left"
                    width="auto"
                  />
                )}
                
                {visibleColumns.includes('status') && (
                  <SortableColumn
                    title="Status"
                    field="status"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-center"
                    width="120px"
                  />
                )}
                
                {visibleColumns.includes('priority') && (
                  <SortableColumn
                    title="Priority"
                    field="priority"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-center"
                    width="120px"
                  />
                )}
                
                {visibleColumns.includes('type') && (
                  <SortableColumn
                    title="Type"
                    field="type"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-center"
                    width="100px"
                  />
                )}
                
                {visibleColumns.includes('assignee') && (
                  <SortableColumn
                    title="Assignee"
                    field="assignee_id"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-left"
                    width="180px"
                  />
                )}
                
                {visibleColumns.includes('project') && (
                  <SortableColumn
                    title="Project"
                    field="project_name"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-left"
                    width="150px"
                  />
                )}
                
                {visibleColumns.includes('due_date') && (
                  <SortableColumn
                    title="Due Date"
                    field="due_date"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-left"
                    width="120px"
                  />
                )}
                
                {visibleColumns.includes('created_at') && (
                  <SortableColumn
                    title="Created"
                    field="created_at"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-left"
                    width="120px"
                  />
                )}
                
                {visibleColumns.includes('actions') && (
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    onTaskClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                >
                  {visibleColumns.includes('title') && (
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </p>
                          {task.description && !compact && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            {task.story_points && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                {task.story_points} SP
                              </span>
                            )}
                            {task.time_estimate && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatTimeEstimate(task.time_estimate)}
                              </div>
                            )}
                            {(task.comment_count ?? 0) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.comment_count} comments
                              </span>
                            )}
                            {(task.attachment_count ?? 0) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.attachment_count} files
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.includes('status') && (
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.includes('priority') && (
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.includes('type') && (
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
                        {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.includes('assignee') && (
                    <td className="px-6 py-4">
                      {task.assignee ? (
                        <AssignmentIndicator
                          assigneeCount={1}
                          primaryAssignee={{
                            id: task.assignee.id,
                            first_name: task.assignee.first_name,
                            last_name: task.assignee.last_name,
                            avatar_url: task.assignee.avatar_url,
                          }}
                        />
                      ) : (
                        <div className="flex items-center text-gray-400 dark:text-gray-600">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Unassigned</span>
                        </div>
                      )}
                    </td>
                  )}
                  
                  {visibleColumns.includes('project') && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {task.project_name || 'Unknown Project'}
                      </div>
                    </td>
                  )}
                  
                  {visibleColumns.includes('due_date') && (
                    <td className="px-6 py-4">
                      {task.due_date ? (
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          <span className={`${
                            new Date(task.due_date) < new Date() && task.status !== 'done' 
                              ? 'text-red-600 dark:text-red-400 font-medium' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-sm">No due date</span>
                      )}
                    </td>
                  )}
                  
                  {visibleColumns.includes('created_at') && (
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCreatedDate(task.created_at)}
                      </span>
                    </td>
                  )}
                  
                  {visibleColumns.includes('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onTaskClick && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(task);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="View task"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onTaskEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskEdit(task);
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Edit task"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {tasks.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters ? (
                <div>
                  <p className="text-lg font-medium mb-2">No tasks match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">No tasks found</p>
                  <p className="text-sm">Get started by creating your first task</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
          showPageSize={true}
          showFirstLast={pagination.pages > 10}
          compact={compact}
        />
      )}
    </div>
  );
};

export default TaskTable;