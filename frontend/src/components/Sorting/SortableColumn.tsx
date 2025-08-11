import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortableColumnProps {
  title: string;
  field: string;
  currentSort?: SortConfig | null;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  children?: React.ReactNode;
}

const SortableColumn: React.FC<SortableColumnProps> = ({
  title,
  field,
  currentSort,
  onSort,
  className = '',
  align = 'left',
  sortable = true,
  width,
  children,
}) => {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : null;

  const handleSort = () => {
    if (!sortable) return;

    let newDirection: 'asc' | 'desc';
    
    if (!isActive || direction === 'desc') {
      newDirection = 'asc';
    } else {
      newDirection = 'desc';
    }
    
    onSort(field, newDirection);
  };

  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  const getSortIcon = () => {
    if (!sortable || !isActive) {
      return (
        <div className="flex flex-col opacity-30">
          <ChevronUpIcon className="h-3 w-3 -mb-1" />
          <ChevronDownIcon className="h-3 w-3" />
        </div>
      );
    }

    if (direction === 'asc') {
      return <ChevronUpIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    }

    return <ChevronDownIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <th
      scope="col"
      className={`px-6 py-3 bg-gray-50 dark:bg-gray-800 ${className}`}
      style={width ? { width } : undefined}
    >
      <div className={`flex items-center space-x-1 ${getAlignmentClass()}`}>
        {sortable ? (
          <button
            type="button"
            onClick={handleSort}
            className={`group inline-flex items-center space-x-1 text-xs font-medium uppercase tracking-wider transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{title}</span>
            <span className="ml-2 flex-none">
              {getSortIcon()}
            </span>
          </button>
        ) : (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
        )}
        {children}
      </div>
    </th>
  );
};

export default SortableColumn;