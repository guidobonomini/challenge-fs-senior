import React from 'react';

const NotificationsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Stay updated with your latest notifications
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Notification Center
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This page will contain real-time notifications for task updates, assignments, comments, and team activities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;