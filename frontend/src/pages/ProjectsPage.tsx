import React, { useEffect, useState } from 'react';
import { useProjectStore, Project } from '../store/projectStore';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, QuestionMarkCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import ProjectModal from '../components/Projects/ProjectModal';
import KeyboardShortcutsModal from '../components/UI/KeyboardShortcutsModal';
import ExportModal from '../components/Export/ExportModal';
import { useKeyboardShortcuts, createTaskShortcuts } from '../hooks/useKeyboardShortcuts';

const ProjectsPage: React.FC = () => {
  const { projects, isLoading, fetchProjects, deleteProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects({ limit: 100 });
  }, [fetchProjects]);

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (deleteConfirm === projectId) {
      await deleteProject(projectId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(projectId);
      // Auto-cancel delete confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Keyboard shortcuts setup
  const projectShortcuts = createTaskShortcuts({
    createTask: handleCreateProject, // Reuse for creating projects
    showHelp: () => setIsHelpModalOpen(true),
  });

  useKeyboardShortcuts({
    shortcuts: projectShortcuts,
    enableGlobal: true,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your projects and track progress ({projects.length} projects)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {projects.length > 0 && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Export Projects"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
            title="Keyboard Shortcuts (Shift + ?)"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first project
            </p>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`}></div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
                  </span>
                  {project.team_name && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.team_name}
                    </span>
                  )}
                </div>

                {project.task_stats && (
                  <div className="flex space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Tasks: {project.task_stats.total}</span>
                    <span>Done: {project.task_stats.completed}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="Edit project"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className={`p-2 rounded-md transition-colors ${
                        deleteConfirm === project.id
                          ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={deleteConfirm === project.id ? 'Click again to confirm delete' : 'Delete project'}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {project.due_date && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Due {formatDistanceToNow(new Date(project.due_date), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
      />
      
      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        shortcuts={projectShortcuts}
      />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={projects}
        type="projects"
        title="Export Projects"
      />
    </div>
  );
};

export default ProjectsPage;