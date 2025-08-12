import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ClockIcon, 
  UserIcon, 
  CalendarIcon,
  FlagIcon,
  TagIcon 
} from '@heroicons/react/24/outline';
import { useTaskStore } from '../store/taskStore';
import { Task, TimeEntry } from '../types';
import TimeTracker from '../components/TimeTracking/TimeTracker';
import TimeEntryList from '../components/TimeTracking/TimeEntryList';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CommentList from '../components/Comments/CommentList';
import AttachmentList from '../components/Task/AttachmentList';
import AttachmentUpload from '../components/Task/AttachmentUpload';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTask, fetchTask, updateTask, isLoading, error } = useTaskStore();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [attachmentRefreshTrigger, setAttachmentRefreshTrigger] = useState(0);

  useEffect(() => {
    if (id) {
      fetchTask(id);
      // In a real app, you would also fetch time entries for this task
      // fetchTimeEntries(id);
    }
  }, [id, fetchTask]);

  const handleTimeUpdate = async (timeSpent: number) => {
    if (currentTask) {
      try {
        // For now, we'll just log the time update since the API might not support this field directly
        // In a real implementation, you'd have a separate API endpoint for time tracking
        console.log(`Time updated for task ${currentTask.id}: ${Math.round(timeSpent / 1000)} seconds`);
        
        // You could call a time tracking API here instead:
        // await timeTrackingService.updateTimeSpent(currentTask.id, Math.round(timeSpent / 1000));
      } catch (error) {
        console.error('Failed to update task time:', error);
      }
    }
  };

  const handleAttachmentUpload = () => {
    setAttachmentRefreshTrigger(prev => prev + 1);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !currentTask) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Task Not Found
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error || 'The requested task could not be found.'}
          </p>
          <button
            onClick={() => navigate('/tasks')}
            className="btn-secondary"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/tasks')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentTask.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {currentTask.project_name && (
                <>Project: {currentTask.project_name} • </>
              )}
              Task #{currentTask.id}
            </p>
          </div>
        </div>
        <button className="btn-secondary">
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Task Details */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Task Information
            </h2>
            
            <div className="space-y-4">
              {currentTask.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {currentTask.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentTask.status)}`}>
                    {currentTask.status.charAt(0).toUpperCase() + currentTask.status.slice(1).replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </h3>
                  <div className="flex items-center">
                    <FlagIcon className={`h-4 w-4 mr-1 ${getPriorityColor(currentTask.priority)}`} />
                    <span className={`capitalize ${getPriorityColor(currentTask.priority)}`}>
                      {currentTask.priority}
                    </span>
                  </div>
                </div>


              </div>

              {(currentTask.assignee || currentTask.reporter) && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {currentTask.assignee && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assignee
                        </h3>
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {currentTask.assignee.first_name} {currentTask.assignee.last_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {currentTask.reporter && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reporter
                        </h3>
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {currentTask.reporter.first_name} {currentTask.reporter.last_name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(currentTask.due_date || currentTask.estimated_hours) && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {currentTask.due_date && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </h3>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {new Date(currentTask.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {currentTask.estimated_hours && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimate
                        </h3>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-900 dark:text-white">
                            {currentTask.estimated_hours}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Entries List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <TimeEntryList
              entries={timeEntries}
              onEdit={(entry) => console.log('Edit entry:', entry)}
              onDelete={(id) => console.log('Delete entry:', id)}
            />
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Attachments
            </h2>
            
            <div className="space-y-6">
              <AttachmentUpload
                taskId={currentTask.id}
                onUploadComplete={handleAttachmentUpload}
              />
              
              <AttachmentList
                taskId={currentTask.id}
                refreshTrigger={attachmentRefreshTrigger}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <CommentList taskId={currentTask.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Tracker */}
          <TimeTracker
            taskId={currentTask.id}
            taskTitle={currentTask.title}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* Time Summary */}
          {currentTask.actual_hours && currentTask.actual_hours > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time Spent:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {currentTask.actual_hours}h
                  </span>
                </div>
                {currentTask.estimated_hours && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
                    <span className="text-gray-900 dark:text-white">
                      {currentTask.estimated_hours}h
                    </span>
                  </div>
                )}
                {currentTask.estimated_hours && currentTask.actual_hours && currentTask.actual_hours > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                      <span className={`font-medium ${
                        currentTask.actual_hours <= currentTask.estimated_hours 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Math.round((currentTask.actual_hours / currentTask.estimated_hours) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Metadata */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Task Metadata
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(currentTask.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(currentTask.updated_at).toLocaleDateString()}
                </span>
              </div>
              {currentTask.started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Started:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(currentTask.started_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {currentTask.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(currentTask.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;