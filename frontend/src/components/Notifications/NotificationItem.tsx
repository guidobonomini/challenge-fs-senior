import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../../types';
import { useNotificationStore } from '../../store/notificationStore';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const getNotificationIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'task_assigned':
      return '👤';
    case 'task_updated':
      return '📝';
    case 'task_commented':
      return '💬';
    case 'task_completed':
      return '✅';
    case 'project_updated':
      return '📊';
    case 'team_invitation':
      return '👥';
    case 'deadline_reminder':
      return '⏰';
    default:
      return '🔔';
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotificationStore();

  const handleClick = () => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to related content
    if (notification.related_task_id) {
      navigate(`/tasks/${notification.related_task_id}`);
    } else if (notification.related_project_id) {
      navigate(`/projects/${notification.related_project_id}`);
    }

    // Close dropdown
    onClick?.();
  };

  return (
    <div
      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        !notification.is_read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;