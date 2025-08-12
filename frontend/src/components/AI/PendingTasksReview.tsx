import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowPathIcon,
  CalendarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { aiCategorizationService, TaskWithSuggestions, AISuggestion, TaskCategory } from '../../services/aiCategorizationService';
import LoadingSpinner from '../UI/LoadingSpinner';
import Pagination from '../Pagination/Pagination';

interface PendingTasksReviewProps {
  projectId?: string;
  onTaskCategorized?: (taskId: string, categoryId: string) => void;
  className?: string;
}

const PendingTasksReview: React.FC<PendingTasksReviewProps> = ({
  projectId,
  onTaskCategorized,
  className = ''
}) => {
  const [tasks, setTasks] = useState<TaskWithSuggestions[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [projectId, pagination.page]);

  const loadCategories = async () => {
    try {
      const data = await aiCategorizationService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await aiCategorizationService.getTasksWithSuggestions({
        page: pagination.page,
        limit: pagination.limit,
        project_id: projectId
      });
      
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load pending tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async (taskId: string, suggestion: AISuggestion) => {
    setActionLoading(taskId);
    try {
      await aiCategorizationService.acceptSuggestion(taskId, suggestion.category_id);
      
      // Remove task from list
      setTasks(prev => prev.filter(task => task.id !== taskId));
      onTaskCategorized?.(taskId, suggestion.category_id);
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSuggestion = async (taskId: string, suggestion: AISuggestion) => {
    setActionLoading(taskId);
    try {
      await aiCategorizationService.rejectSuggestion(taskId, suggestion.category_id);
      
      // Update task by removing this suggestion
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              ai_suggestions: task.ai_suggestions.filter(s => s.category_id !== suggestion.category_id)
            }
          : task
      ).filter(task => task.ai_suggestions.length > 0)); // Remove task if no suggestions left
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getConfidenceBadge = (confidence: number) => {
    const label = aiCategorizationService.getConfidenceLabel(confidence);
    const colorClass = aiCategorizationService.getConfidenceColor(confidence);
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label} ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = getPriorityColor(priority);
    return (
      <div className="flex items-center space-x-1">
        <FlagIcon className={`h-3 w-3 ${colorClass}`} />
        <span className={`text-xs font-medium ${colorClass}`}>
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
      </div>
    );
  };

  const getCategoryDetails = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Tasks Pending Review
            </h3>
            {tasks.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                {pagination.total} pending
              </span>
            )}
          </div>
          
          <button
            onClick={loadTasks}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks with pending AI suggestions</p>
            <p className="text-xs">All tasks are either categorized or have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => {
              const isExpanded = expandedTasks.has(task.id);
              const primarySuggestion = task.ai_suggestions[0];
              const isLoadingThisTask = actionLoading === task.id;

              return (
                <div
                  key={task.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.project_color }}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {task.project_name}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        {getPriorityBadge(task.priority)}
                        
                        {task.due_date && (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className={`h-3 w-3 ${
                              new Date(task.due_date) < new Date() 
                                ? 'text-red-500' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`} />
                            <span className={`text-xs ${
                              new Date(task.due_date) < new Date()
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Due {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {task.estimated_hours && (
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.estimated_hours}h estimated
                            </span>
                          </div>
                        )}
                        
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Suggestion */}
                  {primarySuggestion && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <SparklesIcon className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            AI Recommendation:
                          </span>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: aiCategorizationService.getCategoryColor(primarySuggestion.category_name)
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {primarySuggestion.category_name}
                          </span>
                          {getConfidenceBadge(primarySuggestion.confidence)}
                        </div>
                      </div>
                      
                      <div className="mt-2 ml-6 space-y-2">
                        {(() => {
                          const categoryDetails = getCategoryDetails(primarySuggestion.category_id);
                          return categoryDetails?.description && (
                            <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 border border-purple-200 dark:border-purple-700">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Category Description:</span>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {categoryDetails.description}
                              </p>
                            </div>
                          );
                        })()}
                        <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 border border-purple-200 dark:border-purple-700">
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI Reasoning:</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {primarySuggestion.reasoning}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3 ml-6">
                        <button
                          onClick={() => handleAcceptSuggestion(task.id, primarySuggestion)}
                          disabled={isLoadingThisTask}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Accept
                        </button>
                        
                        <button
                          onClick={() => handleRejectSuggestion(task.id, primarySuggestion)}
                          disabled={isLoadingThisTask}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional Suggestions */}
                  {task.ai_suggestions.length > 1 && (
                    <div>
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-xs text-purple-600 hover:text-purple-500 dark:text-purple-400"
                      >
                        {isExpanded 
                          ? `Hide ${task.ai_suggestions.length - 1} other suggestions`
                          : `Show ${task.ai_suggestions.length - 1} other suggestions`
                        }
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {task.ai_suggestions.slice(1).map((suggestion, index) => (
                            <div 
                              key={suggestion.category_id}
                              className="border border-gray-200 dark:border-gray-600 rounded-md p-2 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ 
                                      backgroundColor: aiCategorizationService.getCategoryColor(suggestion.category_name)
                                    }}
                                  />
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {suggestion.category_name}
                                  </span>
                                  {getConfidenceBadge(suggestion.confidence)}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleAcceptSuggestion(task.id, suggestion)}
                                    disabled={isLoadingThisTask}
                                    className="text-xs text-green-600 hover:text-green-500"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectSuggestion(task.id, suggestion)}
                                    disabled={isLoadingThisTask}
                                    className="text-xs text-red-600 hover:text-red-500"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {suggestion.reasoning}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {isLoadingThisTask && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 flex items-center justify-center rounded-lg">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
              showPageInfo={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingTasksReview;