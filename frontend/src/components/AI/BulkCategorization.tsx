import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { aiCategorizationService } from '../../services/aiCategorizationService';
import LoadingSpinner from '../UI/LoadingSpinner';

interface BulkCategorizationProps {
  projectId: string;
  projectName: string;
  onCompleted?: (processed: number, categorized: number) => void;
  className?: string;
}

const BulkCategorization: React.FC<BulkCategorizationProps> = ({
  projectId,
  projectName,
  onCompleted,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    categorized: number;
    message: string;
  } | null>(null);
  const [acceptSuggestions, setAcceptSuggestions] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBulkCategorize = async () => {
    setIsRunning(true);
    setProgress(null);
    
    try {
      const result = await aiCategorizationService.bulkCategorizeProject(
        projectId,
        acceptSuggestions
      );
      
      setProgress({
        processed: result.processed,
        categorized: result.categorized,
        message: result.message
      });
      
      onCompleted?.(result.processed, result.categorized);
    } catch (error) {
      console.error('Failed to bulk categorize:', error);
      setProgress({
        processed: 0,
        categorized: 0,
        message: 'Failed to complete bulk categorization'
      });
    } finally {
      setIsRunning(false);
      setShowConfirmation(false);
    }
  };

  const startBulkCategorization = () => {
    setShowConfirmation(true);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Bulk AI Categorization
          </h3>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Automatically categorize all uncategorized tasks in {projectName}
        </p>
      </div>

      <div className="p-6">
        {!isRunning && !progress && (
          <div className="space-y-4">
            {/* Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>AI analyzes task titles and descriptions</li>
                    <li>Suggests categories based on detected patterns</li>
                    <li>High-confidence suggestions are applied automatically</li>
                    <li>Low-confidence suggestions are saved for manual review</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="accept-suggestions"
                  type="checkbox"
                  checked={acceptSuggestions}
                  onChange={(e) => setAcceptSuggestions(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="accept-suggestions" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Automatically apply high-confidence suggestions (≥70%)
                </label>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                {acceptSuggestions 
                  ? 'Tasks will be categorized automatically when AI confidence is high'
                  : 'All suggestions will be saved for manual review, no automatic categorization'
                }
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                onClick={startBulkCategorization}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Bulk Categorization
              </button>
            </div>
          </div>
        )}

        {/* Running State */}
        {isRunning && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Analyzing and categorizing tasks...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              This may take a few moments depending on the number of tasks
            </p>
          </div>
        )}

        {/* Results */}
        {progress && !isRunning && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">Bulk categorization completed!</span>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                    {progress.processed}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Tasks Processed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                    {progress.categorized}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Tasks Categorized
                  </div>
                </div>
              </div>
              
              {progress.processed > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Categorization Rate</span>
                    <span>
                      {Math.round((progress.categorized / progress.processed) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(progress.categorized / progress.processed) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Next Steps
              </h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                {progress.categorized < progress.processed && (
                  <p>• Review tasks with pending AI suggestions for manual categorization</p>
                )}
                <p>• Check the categorization statistics to see the distribution</p>
                <p>• Use the filters to find tasks by category</p>
                <p>• Provide feedback on AI suggestions to improve future accuracy</p>
              </div>
            </div>

            {/* Run Again Button */}
            <div className="pt-4">
              <button
                onClick={() => setProgress(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Run Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Confirm Bulk Categorization
              </h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                This will analyze all uncategorized tasks in <strong>{projectName}</strong> 
                and apply AI-suggested categories.
              </p>
              
              {acceptSuggestions ? (
                <p className="text-purple-600 dark:text-purple-400">
                  ✓ High-confidence suggestions will be applied automatically
                </p>
              ) : (
                <p className="text-blue-600 dark:text-blue-400">
                  ✓ All suggestions will be saved for manual review
                </p>
              )}
              
              <p className="text-gray-500 dark:text-gray-500">
                This action cannot be undone, but categories can be changed later.
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleBulkCategorize}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Continue
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkCategorization;