import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';

interface AssignmentIndicatorProps {
  assigneeCount?: number;
  primaryAssignee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  compact?: boolean;
}

const AssignmentIndicator: React.FC<AssignmentIndicatorProps> = ({
  assigneeCount = 0,
  primaryAssignee,
  compact = false,
}) => {
  const getUserInitials = (user: { first_name: string; last_name: string }) => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = (user: { first_name: string; last_name: string }) => {
    return `${user.first_name} ${user.last_name}`;
  };

  if (assigneeCount === 0 && !primaryAssignee) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
        <UsersIcon className="w-3 h-3" />
        <span>{assigneeCount}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {primaryAssignee && (
        <div className="flex items-center space-x-2">
          {primaryAssignee.avatar_url ? (
            <img
              src={primaryAssignee.avatar_url}
              alt={getUserDisplayName(primaryAssignee)}
              className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {getUserInitials(primaryAssignee)}
            </div>
          )}
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getUserDisplayName(primaryAssignee)}
          </span>
        </div>
      )}
      
      {assigneeCount > 1 && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">
            +{assigneeCount - 1} more
          </span>
        </div>
      )}
      
      {assigneeCount === 0 && !primaryAssignee && (
        <div className="flex items-center space-x-1 text-gray-400">
          <UsersIcon className="w-4 h-4" />
          <span className="text-xs">Unassigned</span>
        </div>
      )}
    </div>
  );
};

export default AssignmentIndicator;