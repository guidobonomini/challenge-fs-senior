import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useSidebarStore } from '../../store/sidebarStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: RectangleStackIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Teams', href: '/teams', icon: UserGroupIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'AI Categorization', href: '/ai-categorization', icon: SparklesIcon },
  { name: 'Notifications', href: '/notifications', icon: BellIcon },
];

const secondaryNavigation = [
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  return (
    <div className={`flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 bg-primary-600 rounded-md flex items-center justify-center hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5 text-white" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <button
                  onClick={toggleSidebar}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 focus:outline-none"
                >
                  TaskManager
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 flex flex-col divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
          <div className="px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  } group flex items-center ${
                    isCollapsed ? 'px-2 py-3 justify-center' : 'px-2 py-2'
                  } text-sm font-medium rounded-md transition-all duration-150`
                }
              >
                <item.icon 
                  className={`h-5 w-5 flex-shrink-0 ${
                    isCollapsed ? '' : 'mr-3'
                  }`} 
                  aria-hidden="true" 
                />
                {!isCollapsed && item.name}
              </NavLink>
            ))}
          </div>
          <div className="mt-6 pt-6">
            <div className="px-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center ${
                      isCollapsed ? 'px-2 py-3 justify-center' : 'px-2 py-2'
                    } text-sm font-medium rounded-md transition-all duration-150`
                  }
                >
                  <item.icon 
                    className={`h-5 w-5 flex-shrink-0 ${
                      isCollapsed ? '' : 'mr-3'
                    }`} 
                    aria-hidden="true" 
                  />
                  {!isCollapsed && item.name}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;