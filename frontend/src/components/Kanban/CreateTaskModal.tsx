import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateTaskData } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { createTask, isLoading } = useTaskStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<CreateTaskData>();

  const onSubmit = async (data: CreateTaskData) => {
    if (!projectId) {
      setError('project_id', { message: 'Project ID is required' });
      return;
    }

    try {
      await createTask({
        ...data,
        project_id: projectId,
        time_estimate: data.time_estimate ? data.time_estimate * 60 : undefined, // Convert hours to seconds
      });
      
      reset();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 400) {
        const details = error.response.data?.details;
        if (details) {
          details.forEach((detail: any) => {
            setError(detail.field as keyof CreateTaskData, {
              message: detail.message,
            });
          });
        }
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-[99999]"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Task
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 1, message: 'Title must not be empty' },
                  maxLength: { value: 200, message: 'Title must not exceed 200 characters' },
                })}
                className={`input-base ${errors.title ? 'border-error-500' : ''}`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 2000, message: 'Description must not exceed 2000 characters' },
                })}
                rows={3}
                className={`input-base ${errors.description ? 'border-error-500' : ''}`}
                placeholder="Enter task description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Priority and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="input-base"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  {...register('type')}
                  className="input-base"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
            </div>

            {/* Story Points and Time Estimate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="story_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Story Points
                </label>
                <input
                  {...register('story_points', {
                    min: { value: 1, message: 'Story points must be at least 1' },
                    max: { value: 100, message: 'Story points must not exceed 100' },
                  })}
                  type="number"
                  min="1"
                  max="100"
                  className={`input-base ${errors.story_points ? 'border-error-500' : ''}`}
                  placeholder="1-100"
                />
                {errors.story_points && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                    {errors.story_points.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="time_estimate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Estimate (hours)
                </label>
                <input
                  {...register('time_estimate', {
                    min: { value: 0.25, message: 'Time estimate must be at least 15 minutes' },
                  })}
                  type="number"
                  step="0.25"
                  min="0.25"
                  className={`input-base ${errors.time_estimate ? 'border-error-500' : ''}`}
                  placeholder="Hours"
                />
                {errors.time_estimate && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                    {errors.time_estimate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                {...register('due_date')}
                type="date"
                className="input-base"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateTaskModal;