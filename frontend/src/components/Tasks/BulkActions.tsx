import React, { useState } from 'react';
import { 
  TrashIcon, 
  PencilIcon, 
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Task, TaskStatus, Priority } from '../../types';

interface BulkActionsProps {
  selectedTasks: Task[];
  onBulkUpdate: (updates: Partial<Task>) => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkAssign: (assigneeId: string) => void;
  onClearSelection: () => void;
  availableUsers?: Array<{ id: string; first_name: string; last_name: string; }>;
  className?: string;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasks,
  onBulkUpdate,
  onBulkDelete,
  onBulkArchive,
  onBulkAssign,
  onClearSelection,
  availableUsers = [],
  className = '',
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);

  const handleStatusUpdate = (status: TaskStatus) => {
    onBulkUpdate({ status });
    setShowStatusMenu(false);
  };

  const handlePriorityUpdate = (priority: Priority) => {
    onBulkUpdate({ priority });
    setShowPriorityMenu(false);
  };

  const handleAssigneeUpdate = (assigneeId: string) => {
    onBulkAssign(assigneeId);
    setShowAssigneeMenu(false);
  };

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: 'To Do', color: 'text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-700' },
    { value: 'in_review', label: 'In Review', color: 'text-yellow-700' },
    { value: 'done', label: 'Done', color: 'text-green-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-700' },
  ];

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-green-700' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-700' },
    { value: 'high', label: 'High', color: 'text-orange-700' },
    { value: 'urgent', label: 'Critical', color: 'text-red-700' },
  ];

  if (selectedTasks.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Selection info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{selectedTasks.length}</span>
            <span>task{selectedTasks.length !== 1 ? 's' : ''} selected</span>
            <button
              onClick={onClearSelection}
              className="ml-2 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Clear
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Status Update */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Status
              </button>
              
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusUpdate(option.value)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${option.color}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Update */}
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Priority
              </button>
              
              {showPriorityMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {priorityOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handlePriorityUpdate(option.value)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${option.color}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assignee Update */}
            {availableUsers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Assign
                </button>
                
                {showAssigneeMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto">
                    <div className="py-1">
                      <button
                        onClick={() => handleAssigneeUpdate('')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Unassigned
                      </button>
                      {availableUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleAssigneeUpdate(user.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {user.first_name} {user.last_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Archive */}
            <button
              onClick={onBulkArchive}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Archive tasks"
            >
              <ArchiveBoxIcon className="h-4 w-4 mr-1" />
              Archive
            </button>

            {/* Delete */}
            <button
              onClick={onBulkDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete tasks"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;