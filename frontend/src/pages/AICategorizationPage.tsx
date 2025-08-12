import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';
import TaskCategorizationPanel from '../components/AI/TaskCategorizationPanel';
import CategoryManagement from '../components/AI/CategoryManagement';
import CategorizationStats from '../components/AI/CategorizationStats';
import PendingTasksReview from '../components/AI/PendingTasksReview';
import BulkCategorization from '../components/AI/BulkCategorization';
import { useProjectStore } from '../store/projectStore';

const AICategorizationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { projects, fetchProjects } = useProjectStore();
  const selectedProjectId = searchParams.get('project');
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    setSearchParams(newParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      description: 'Categorization statistics and insights'
    },
    {
      id: 'pending',
      name: 'Pending Review',
      icon: ClockIcon,
      description: 'Tasks with AI suggestions awaiting review'
    },
    {
      id: 'bulk',
      name: 'Bulk Categorization',
      icon: PlayIcon,
      description: 'Automatically categorize multiple tasks'
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: Cog6ToothIcon,
      description: 'Manage task categories and settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Task Categorization
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Leverage AI to automatically categorize and organize your tasks
                {selectedProject && ` for ${selectedProject.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {!selectedProject && projects.length > 0 && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-blue-500 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Select a Project
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Choose a project to view AI categorization features and bulk operations.
                </p>
                <div className="mt-3">
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => {
                      const newParams = new URLSearchParams(searchParams);
                      if (e.target.value) {
                        newParams.set('project', e.target.value);
                      } else {
                        newParams.delete('project');
                      }
                      setSearchParams(newParams);
                    }}
                    className="block w-full max-w-sm px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${
                    isActive
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <CategorizationStats 
                projectId={selectedProjectId || undefined}
                refreshTrigger={refreshTrigger}
              />
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => handleTabChange('pending')}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Review Suggestions
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Review and approve AI categorization suggestions
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTabChange('bulk')}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <PlayIcon className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Bulk Categorization
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically categorize multiple tasks at once
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTabChange('categories')}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Cog6ToothIcon className="h-8 w-8 text-gray-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Manage Categories
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create and manage task categories
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <PendingTasksReview
              projectId={selectedProjectId || undefined}
              onTaskCategorized={handleRefresh}
            />
          )}

          {activeTab === 'bulk' && selectedProject && (
            <BulkCategorization
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              onCompleted={handleRefresh}
            />
          )}

          {activeTab === 'bulk' && !selectedProject && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Project
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a project above to run bulk categorization on its tasks.
              </p>
            </div>
          )}

          {activeTab === 'categories' && (
            <CategoryManagement onCategoryUpdated={handleRefresh} />
          )}
        </div>

        {/* Demo Task Panel - Only show if no project is selected */}
        {!selectedProject && activeTab === 'overview' && (
          <div className="mt-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ✨ Live Demo: Task Categorization Panel
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This is a fully functional demo using real AI categorization. Try accepting or rejecting the suggestions below!
              </p>
            </div>
            <TaskCategorizationPanel
              taskId="cbc234ef-9041-43fd-b2aa-c3b612d9d867"
              onCategorized={() => {
                // Refresh the page to show updated stats
                handleRefresh();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AICategorizationPage;