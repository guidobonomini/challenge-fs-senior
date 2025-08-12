import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Project Details
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Project ID: {id}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Project Detail View
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This page will show detailed project information, tasks, team members, and project analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;