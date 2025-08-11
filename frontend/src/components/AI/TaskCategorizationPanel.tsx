import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  TagIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon as SparklesIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import { aiCategorizationService, TaskCategory, AISuggestion, AIAnalysisResult } from '../../services/aiCategorizationService';
import LoadingSpinner from '../UI/LoadingSpinner';

interface TaskCategorizationPanelProps {
  taskId: string;
  currentCategoryId?: string;
  onCategorized?: (categoryId: string | null) => void;
  className?: string;
}

const TaskCategorizationPanel: React.FC<TaskCategorizationPanelProps> = ({
  taskId,
  currentCategoryId,
  onCategorized,
  className = ''
}) => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [primarySuggestion, setPrimarySuggestion] = useState<AISuggestion | null>(null);
  const [keywordsDetected, setKeywordsDetected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(currentCategoryId || null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  useEffect(() => {
    loadCategories();
    analyzeTask();
  }, [taskId]);

  const loadCategories = async () => {
    try {
      const data = await aiCategorizationService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const analyzeTask = async () => {
    if (!taskId) return;
    
    setAnalyzing(true);
    try {
      const result = await aiCategorizationService.analyzeTask(taskId);
      setSuggestions(result.analysis.suggestions);
      setPrimarySuggestion(result.analysis.primary_suggestion);
      setKeywordsDetected(result.analysis.keywords_detected);
    } catch (error) {
      console.error('Failed to analyze task:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
    setLoading(true);
    try {
      await aiCategorizationService.acceptSuggestion(
        taskId,
        suggestion.category_id,
        feedback || undefined
      );
      setSelectedCategoryId(suggestion.category_id);
      onCategorized?.(suggestion.category_id);
      setShowFeedback(null);
      setFeedback('');
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSuggestion = async (suggestion: AISuggestion) => {
    setLoading(true);
    try {
      await aiCategorizationService.rejectSuggestion(
        taskId,
        suggestion.category_id,
        feedback || undefined
      );
      // Remove suggestion from list
      setSuggestions(prev => prev.filter(s => s.category_id !== suggestion.category_id));
      if (primarySuggestion?.category_id === suggestion.category_id) {
        setPrimarySuggestion(suggestions[1] || null);
      }
      setShowFeedback(null);
      setFeedback('');
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCategorization = async (categoryId: string | null) => {
    setLoading(true);
    try {
      await aiCategorizationService.manualCategorization(taskId, categoryId);
      setSelectedCategoryId(categoryId);
      onCategorized?.(categoryId);
    } catch (error) {
      console.error('Failed to categorize manually:', error);
    } finally {
      setLoading(false);
    }
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

  const getCategoryIcon = (category: TaskCategory) => {
    // In a real implementation, you'd map the icon string to actual icons
    return <TagIcon className="h-4 w-4" />;
  };

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Task Categorization
          </h3>
        </div>
        
        <button
          onClick={analyzeTask}
          disabled={analyzing}
          className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${analyzing ? 'animate-spin' : ''}`} />
          Re-analyze
        </button>
      </div>

      {/* Current Category */}
      {currentCategory && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(currentCategory)}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Current Category: {currentCategory.name}
              </span>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: currentCategory.color }}
              />
            </div>
            <button
              onClick={() => handleManualCategorization(null)}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-500 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {analyzing ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Analyzing task content...
          </span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-4">
          {/* Primary Suggestion */}
          {primarySuggestion && (
            <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <SparklesIconSolid className="h-5 w-5 text-purple-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      AI Recommendation
                    </span>
                    {getConfidenceBadge(primarySuggestion.confidence)}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: aiCategorizationService.getCategoryColor(primarySuggestion.category_name) }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {primarySuggestion.category_name}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {primarySuggestion.reasoning}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAcceptSuggestion(primarySuggestion)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Accept
                </button>
                
                <button
                  onClick={() => setShowFeedback(primarySuggestion.category_id)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </button>
                
                <button
                  onClick={() => setShowFeedback(primarySuggestion.category_id)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Add feedback
                </button>
              </div>
            </div>
          )}

          {/* Additional Suggestions */}
          {suggestions.length > 1 && (
            <div>
              <button
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 mb-2"
              >
                <span>
                  {showAllSuggestions ? 'Hide' : 'Show'} additional suggestions ({suggestions.length - 1})
                </span>
              </button>
              
              {showAllSuggestions && (
                <div className="space-y-2">
                  {suggestions.slice(1).map((suggestion, index) => (
                    <div 
                      key={suggestion.category_id}
                      className="border border-gray-200 dark:border-gray-600 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: aiCategorizationService.getCategoryColor(suggestion.category_name) }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.category_name}
                          </span>
                          {getConfidenceBadge(suggestion.confidence)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAcceptSuggestion(suggestion)}
                            disabled={loading}
                            className="text-sm text-green-600 hover:text-green-500"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectSuggestion(suggestion)}
                            disabled={loading}
                            className="text-sm text-red-600 hover:text-red-500"
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

          {/* Detected Keywords */}
          {keywordsDetected.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Detected Keywords
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {keywordsDetected.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No AI suggestions available. The task content may not match any known patterns.
          </p>
        </div>
      )}

      {/* Manual Category Selection */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or select category manually:
        </label>
        <select
          value={selectedCategoryId || ''}
          onChange={(e) => handleManualCategorization(e.target.value || null)}
          disabled={loading}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">No category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Provide Feedback
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Help us improve AI suggestions (optional)..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  const suggestion = suggestions.find(s => s.category_id === showFeedback);
                  if (suggestion) {
                    handleRejectSuggestion(suggestion);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reject with Feedback
              </button>
              <button
                onClick={() => {
                  setShowFeedback(null);
                  setFeedback('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  );
};

export default TaskCategorizationPanel;