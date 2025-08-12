import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import { useAuthStore } from '../store/authStore';

const Analytics: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId') || undefined;
  const { user } = useAuthStore();

  // Determine dashboard title based on context
  const getDashboardTitle = () => {
    if (projectId && teamId) {
      return 'Project & Team Analytics';
    }
    if (projectId) {
      return 'Project Analytics';
    }
    if (teamId) {
      return 'Team Analytics';
    }
    return 'Analytics Dashboard';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please log in to view analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard
          projectId={projectId}
          teamId={teamId}
          title={getDashboardTitle()}
        />
      </div>
    </div>
  );
};

export default Analytics;