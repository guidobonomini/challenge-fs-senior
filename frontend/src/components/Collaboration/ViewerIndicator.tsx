import React from 'react';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

interface ViewerIndicatorProps {
  viewers: User[];
  currentUserId: string;
  maxDisplayed?: number;
}

const ViewerIndicator: React.FC<ViewerIndicatorProps> = ({ 
  viewers, 
  currentUserId, 
  maxDisplayed = 3 
}) => {
  // Filter out current user from viewers
  const otherViewers = viewers.filter(viewer => viewer.id !== currentUserId);
  
  if (otherViewers.length === 0) {
    return null;
  }

  const displayedViewers = otherViewers.slice(0, maxDisplayed);
  const remainingCount = otherViewers.length - maxDisplayed;

  const getInitials = (user: User) => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = (user: User) => {
    return `${user.first_name} ${user.last_name}`;
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {otherViewers.length === 1 
            ? `${getUserDisplayName(otherViewers[0])} is viewing`
            : `${otherViewers.length} people viewing`
          }
        </span>
      </div>

      <div className="flex -space-x-2">
        {displayedViewers.map((viewer) => (
          <div
            key={viewer.id}
            className="relative"
            title={getUserDisplayName(viewer)}
          >
            {viewer.avatar_url ? (
              <img
                src={viewer.avatar_url}
                alt={getUserDisplayName(viewer)}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-blue-500 flex items-center justify-center text-xs font-medium text-white">
                {getInitials(viewer)}
              </div>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-500 flex items-center justify-center text-xs font-medium text-white"
            title={`+${remainingCount} more viewers`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerIndicator;