import React from 'react';
import { ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TimeEntry } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface TimeEntryListProps {
  entries: TimeEntry[];
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  className?: string;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({
  entries,
  onEdit,
  onDelete,
  className = ''
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalTime = (): number => {
    return entries.reduce((total, entry) => total + entry.duration, 0);
  };

  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No time entries recorded yet</p>
        <p className="text-sm">Start tracking time to see entries here</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Time Entries
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {formatDuration(getTotalTime())}
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDuration(entry.duration)}
                  </span>
                  <span className="mx-2 text-gray-300 dark:text-gray-500">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.date ? new Date(entry.date).toLocaleDateString() : 'Today'}
                  </span>
                </div>

                {entry.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {entry.description}
                  </p>
                )}

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {entry.started_at && (
                    <>
                      <span>
                        Started {formatDistanceToNow(new Date(entry.started_at), { addSuffix: true })}
                      </span>
                      {entry.ended_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Ended {formatDistanceToNow(new Date(entry.ended_at), { addSuffix: true })}
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {entry.user && (
                    <>
                      <span className="mx-2">•</span>
                      <span>by {entry.user.first_name} {entry.user.last_name}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(entry)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Edit time entry"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete time entry"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {entry.is_running && (
              <div className="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Currently running
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeEntryList;