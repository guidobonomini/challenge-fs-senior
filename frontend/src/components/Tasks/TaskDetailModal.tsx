import React, { useState } from 'react';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Task } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import CommentList from '../Comments/CommentList';
import TaskModal from './TaskModal';
import AttachmentUpload from '../Task/AttachmentUpload';
import AttachmentList from '../Task/AttachmentList';
import ViewerIndicator from '../Collaboration/ViewerIndicator';
import TaskAssignmentPanel from '../Assignment/TaskAssignmentPanel';
import { useTaskViewers } from '../../hooks/useTaskViewers';
import { useAuthStore } from '../../store/authStore';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'assignments'>('details');
  const [attachmentRefreshTrigger, setAttachmentRefreshTrigger] = useState(0);
  
  const { user } = useAuthStore();
  const { viewers } = useTaskViewers({ 
    taskId: isOpen ? task.id : undefined, 
    enabled: isOpen 
  });

  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  const handleAttachmentUploaded = () => {
    setAttachmentRefreshTrigger(prev => prev + 1);
  };

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
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

  const getTypeColor = (type: string) => {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[99998]">
        <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {task.title}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit task"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <ViewerIndicator 
                  viewers={viewers} 
                  currentUserId={user.id} 
                  maxDisplayed={3}
                />
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attachments'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Attachments
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Assignments
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status, Priority, Type badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(task.type)}`}>
                  {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                </span>
                {task.story_points && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                    {task.story_points} SP
                  </span>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Assignee</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.assignee_id ? 'Assigned user' : 'Unassigned'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Reporter</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.reporter_id ? 'Reporting user' : 'Unknown'}
                    </p>
                  </div>

                  {task.due_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Due Date</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {task.time_estimate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Time Estimate</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.floor(task.time_estimate / 60)}h {task.time_estimate % 60}m
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Time Spent</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.floor(task.time_spent / 60)}h {task.time_spent % 60}m
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Created</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="mt-6">
              <CommentList taskId={task.id} />
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Attachment</h3>
                <AttachmentUpload
                  taskId={task.id}
                  onUploadComplete={handleAttachmentUploaded}
                />
              </div>

              {/* Attachments List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Attachments</h3>
                <AttachmentList
                  taskId={task.id}
                  refreshTrigger={attachmentRefreshTrigger}
                />
              </div>
            </div>
          )}

          {activeTab === 'assignments' && task.team_id && (
            <TaskAssignmentPanel
              taskId={task.id}
              teamId={task.team_id}
              onAssignmentChange={() => {
                // Optionally refresh task data when assignments change
                // onTaskUpdate?.();
              }}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        task={task}
      />
    </>
  );
};

export default TaskDetailModal;