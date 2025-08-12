import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  SparklesIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { aiCategorizationService, CategorizationStats } from '../../services/aiCategorizationService';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CategorizationStatsProps {
  projectId?: string;
  refreshTrigger?: number;
  className?: string;
}

const CategorizationStatsComponent: React.FC<CategorizationStatsProps> = ({
  projectId,
  refreshTrigger,
  className = ''
}) => {
  const [stats, setStats] = useState<CategorizationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [projectId, refreshTrigger]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await aiCategorizationService.getCategorizationStats(projectId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load categorization stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Failed to load categorization statistics</p>
      </div>
    );
  }

  const categorizationPercentage = stats.total_tasks > 0 
    ? Math.round((stats.categorized_tasks / stats.total_tasks) * 100) 
    : 0;

  const aiPercentage = stats.categorized_tasks > 0 
    ? Math.round((stats.ai_categorized_tasks / stats.categorized_tasks) * 100) 
    : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Categorization Statistics
          </h3>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Tasks */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total_tasks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Categorized Tasks */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Categorized
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-green-900 dark:text-green-200">
                    {stats.categorized_tasks.toLocaleString()}
                  </p>
                  <p className="ml-2 text-sm text-green-600 dark:text-green-400">
                    ({categorizationPercentage}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Categorized */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  AI Categorized
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-purple-900 dark:text-purple-200">
                    {stats.ai_categorized_tasks.toLocaleString()}
                  </p>
                  <p className="ml-2 text-sm text-purple-600 dark:text-purple-400">
                    ({aiPercentage}%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Suggestions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Pending Review
                </p>
                <p className="text-2xl font-semibold text-yellow-900 dark:text-yellow-200">
                  {stats.pending_suggestions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Categorization Progress</span>
            <span>{categorizationPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${categorizationPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Distribution */}
        {stats.category_distribution.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Category Distribution
            </h4>
            <div className="space-y-3">
              {stats.category_distribution.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: aiCategorizationService.getCategoryColor(category.category_name)
                      }}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {category.category_name}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-3">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: aiCategorizationService.getCategoryColor(category.category_name)
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{category.count}</span>
                    <span>({category.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Insights */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Insights
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            {categorizationPercentage < 50 && (
              <p>• Consider running bulk categorization to improve coverage</p>
            )}
            {stats.pending_suggestions > 10 && (
              <p>• {stats.pending_suggestions} tasks have AI suggestions awaiting review</p>
            )}
            {aiPercentage > 70 && (
              <p>• Great job! AI is handling most of your categorization needs</p>
            )}
            {stats.manual_categorized_tasks > stats.ai_categorized_tasks && (
              <p>• Most categorization is manual - AI could help automate this process</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorizationStatsComponent;