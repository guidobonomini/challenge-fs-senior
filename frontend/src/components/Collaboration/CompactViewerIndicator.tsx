import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

interface CompactViewerIndicatorProps {
  viewers: User[];
  currentUserId: string;
}

const CompactViewerIndicator: React.FC<CompactViewerIndicatorProps> = ({ 
  viewers, 
  currentUserId 
}) => {
  // Filter out current user from viewers
  const otherViewers = viewers.filter(viewer => viewer.id !== currentUserId);
  
  if (otherViewers.length === 0) {
    return null;
  }

  const getViewersTooltip = () => {
    if (otherViewers.length === 1) {
      const viewer = otherViewers[0];
      return `${viewer.first_name} ${viewer.last_name} is viewing`;
    }
    
    const names = otherViewers.slice(0, 3).map(v => `${v.first_name} ${v.last_name}`);
    const remaining = otherViewers.length - 3;
    
    if (remaining > 0) {
      return `${names.join(', ')} and ${remaining} more are viewing`;
    }
    
    return `${names.join(', ')} are viewing`;
  };

  return (
    <div 
      className="flex items-center gap-1 text-green-600 dark:text-green-400"
      title={getViewersTooltip()}
    >
      <EyeIcon className="w-3 h-3" />
      <span className="text-xs">{otherViewers.length}</span>
      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
    </div>
  );
};

export default CompactViewerIndicator;