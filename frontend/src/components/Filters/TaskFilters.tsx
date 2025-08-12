import React, { useState, useCallback } from 'react';
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Task, Priority, TaskStatus } from '../../types';
import { debounce } from 'lodash';

export interface TaskFilterOptions {
  search?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  assignee_id?: string[];
  reporter_id?: string;
  project_id?: string[];
  due_date_from?: string;
  due_date_to?: string;
  created_from?: string;
  created_to?: string;
  has_attachments?: boolean;
  has_comments?: boolean;
  is_overdue?: boolean;
  tags?: string[];
}

interface TaskFiltersProps {
  filters: TaskFilterOptions;
  onFiltersChange: (filters: TaskFilterOptions) => void;
  onClearFilters: () => void;
  availableUsers?: Array<{ id: string; first_name: string; last_name: string; }>;
  availableProjects?: Array<{ id: string; name: string; }>;
  className?: string;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableUsers = [],
  availableProjects = [],
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounced search to avoid excessive API calls
  const debouncedSearchChange = useCallback(
    debounce((value: string) => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300),
    [filters, onFiltersChange]
  );

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    debouncedSearchChange(value);
  };

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handlePriorityChange = (priority: Priority, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    onFiltersChange({
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    });
  };


  const handleAssigneeChange = (userId: string, checked: boolean) => {
    const currentAssignees = filters.assignee_id || [];
    const newAssignees = checked
      ? [...currentAssignees, userId]
      : currentAssignees.filter(id => id !== userId);
    
    onFiltersChange({
      ...filters,
      assignee_id: newAssignees.length > 0 ? newAssignees : undefined
    });
  };

  const handleProjectChange = (projectId: string, checked: boolean) => {
    const currentProjects = filters.project_id || [];
    const newProjects = checked
      ? [...currentProjects, projectId]
      : currentProjects.filter(id => id !== projectId);
    
    onFiltersChange({
      ...filters,
      project_id: newProjects.length > 0 ? newProjects : undefined
    });
  };

  const handleDateRangeChange = (field: 'due_date_from' | 'due_date_to' | 'created_from' | 'created_to', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const handleBooleanFilterChange = (field: 'has_attachments' | 'has_comments' | 'is_overdue', checked: boolean) => {
    onFiltersChange({
      ...filters,
      [field]: checked || undefined
    });
  };


  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof TaskFilterOptions];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_review', label: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];


  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {isExpanded ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <FunnelIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Status Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => (
                <label key={option.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Priority</h4>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map(option => (
                <label key={option.value} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.priority?.includes(option.value) || false}
                    onChange={(e) => handlePriorityChange(option.value, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>


          {/* Assignee Filters */}
          {availableUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                Assignee
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {availableUsers.map(user => (
                  <label key={user.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.assignee_id?.includes(user.id) || false}
                      onChange={(e) => handleAssigneeChange(user.id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {user.first_name} {user.last_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Project Filters */}
          {availableProjects.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Project</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {availableProjects.map(project => (
                  <label key={project.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.project_id?.includes(project.id) || false}
                      onChange={(e) => handleProjectChange(project.id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {project.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Due Date Range
              </h4>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.due_date_from || ''}
                  onChange={(e) => handleDateRangeChange('due_date_from', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.due_date_to || ''}
                  onChange={(e) => handleDateRangeChange('due_date_to', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="To"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Created Date Range</h4>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.created_from || ''}
                  onChange={(e) => handleDateRangeChange('created_from', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.created_to || ''}
                  onChange={(e) => handleDateRangeChange('created_to', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="To"
                />
              </div>
            </div>
          </div>


          {/* Boolean Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Additional Filters</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.has_attachments || false}
                  onChange={(e) => handleBooleanFilterChange('has_attachments', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has attachments</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.has_comments || false}
                  onChange={(e) => handleBooleanFilterChange('has_comments', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has comments</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.is_overdue || false}
                  onChange={(e) => handleBooleanFilterChange('is_overdue', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Overdue</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;