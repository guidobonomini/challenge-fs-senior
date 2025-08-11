import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebarStore } from '../../store/sidebarStore';
import { useKeyboardShortcuts, createNavigationShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebarStore();
  const navigate = useNavigate();

  // Global navigation shortcuts
  const navigationShortcuts = createNavigationShortcuts({
    goToDashboard: () => navigate('/dashboard'),
    goToProjects: () => navigate('/projects'),
    goToTasks: () => navigate('/tasks'),
    goToTeams: () => navigate('/teams'),
  });

  useKeyboardShortcuts({
    shortcuts: navigationShortcuts,
    enableGlobal: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-16' : 'ml-64'
        } relative isolate`}>
          <Header />
          
          {/* Page content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-0 isolate">
            <div className="relative z-0" style={{ zIndex: '1' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;