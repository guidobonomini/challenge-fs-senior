import React, { useState, useRef, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            <span className="sr-only">New notifications</span>
          </span>
        )}
      </Menu.Button>

      <Transition
        show={isOpen}
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          static
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[99999]"
          onBlur={() => setIsOpen(false)}
        >
          <div className="py-2">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => setIsOpen(false)}
                  />
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <BellIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to notifications page
                    window.location.href = '/notifications';
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationDropdown;