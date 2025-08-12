import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import { useTaskStore } from '../../store/taskStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import { Task, CreateTaskData, Category } from '../../types';
import { apiService } from '../../services/api';
import { categoryService } from '../../services/categoryService';
import CommentList from '../Comments/CommentList';
import AttachmentList from '../Task/AttachmentList';
import AttachmentUpload from '../Task/AttachmentUpload';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  assignee_id: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id: string;
  estimated_hours: number | '';
  actual_hours: number | '';
  due_date: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task, projectId }) => {
  const { createTask, updateTask, isLoading } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project_id: projectId || '',
    assignee_id: '',
    status: 'todo',
    priority: 'medium',
    category_id: '',
    estimated_hours: '',
    actual_hours: '',
    due_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allUsers, setAllUsers] = useState<Array<{ id: string; first_name: string; last_name: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [attachmentRefreshTrigger, setAttachmentRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'general' | 'comments' | 'attachments'>('general');

  useEffect(() => {
    if (isOpen) {
      fetchProjects({ limit: 100 });
      fetchCategories();
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          project_id: task.project_id || '',
          assignee_id: task.assignee_id || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          category_id: task.category_id || '',
          estimated_hours: task.estimated_hours || '',
          actual_hours: task.actual_hours || '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
        });
        // Fetch users first, then ensure assignee is in the list
        fetchAllUsers(task);
      } else {
        setFormData({
          title: '',
          description: '',
          project_id: projectId || '',
          assignee_id: user?.id || '',
          status: 'todo',
          priority: 'medium',
          category_id: '',
          estimated_hours: '',
          actual_hours: '',
          due_date: '',
        });
        fetchAllUsers();
      }
      setErrors({});
    }
  }, [isOpen, task, fetchProjects, user]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAllUsers = async (editingTask?: Task | null) => {
    setLoadingUsers(true);
    try {
      const response = await apiService.get(`/users`, { limit: 100 }) as { users: Array<{ id: string; first_name: string; last_name: string; email: string }> };
      let users = response.users || [];
      
      // Add current user to the list since the API excludes them
      if (user) {
        const currentUserExists = users.find(u => u.id === user.id);
        if (!currentUserExists) {
          users.unshift({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
          });
        }
      }
      
      // If editing a task and the assigned user is not in the list, add them
      if (editingTask && editingTask.assignee_id && editingTask.assignee) {
        const assigneeExists = users.find(u => u.id === editingTask.assignee_id);
        if (!assigneeExists) {
          users.unshift({
            id: editingTask.assignee.id,
            first_name: editingTask.assignee.first_name,
            last_name: editingTask.assignee.last_name,
            email: editingTask.assignee.email,
          });
        }
      }
      
      
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (!formData.project_id) {
      newErrors.project_id = 'Project selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateTaskData = {
        title: formData.title,
        description: formData.description || undefined,
        project_id: formData.project_id,
        assignee_id: formData.assignee_id || undefined,
        status: formData.status,
        priority: formData.priority,
        category_id: formData.category_id || undefined,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        actual_hours: formData.actual_hours ? Number(formData.actual_hours) : undefined,
        due_date: formData.due_date || undefined,
      };

      if (task) {
        await updateTask(task.id, submitData);
      } else {
        await createTask(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Tab Navigation - Only show for existing tasks */}
        {task && (
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'comments'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Comments
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attachments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'attachments'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Attachments
              </button>
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-4">
          {/* General Tab */}
          {(!task || activeTab === 'general') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter task title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project *
                  </label>
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.project_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignee
                  </label>
                  <select
                    name="assignee_id"
                    value={formData.assignee_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading users...' : 'Unassigned'}
                    </option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? 'Loading categories...' : 'No category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimated_hours"
                    value={formData.estimated_hours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    name="actual_hours"
                    value={formData.actual_hours}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Hours"
                  />
                </div>
              </div>
            </>
          )}

          {/* Comments Tab */}
          {task && activeTab === 'comments' && (
            <div className="min-h-[400px]">
              <CommentList taskId={task.id} />
            </div>
          )}

          {/* Attachments Tab */}
          {task && activeTab === 'attachments' && (
            <div className="min-h-[400px] space-y-4">
              <AttachmentUpload 
                taskId={task.id}
                onUploadComplete={() => setAttachmentRefreshTrigger(prev => prev + 1)}
              />
              <AttachmentList 
                taskId={task.id}
                refreshTrigger={attachmentRefreshTrigger}
              />
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          {(!task || activeTab === 'general') && (
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;