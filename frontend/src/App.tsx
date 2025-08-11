import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layout components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import Analytics from './pages/Analytics';
import AICategorizationPage from './pages/AICategorizationPage';

// Route protection components
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore();
  const { initialize: initializeTheme } = useThemeStore();

  useEffect(() => {
    // Initialize stores
    initialize();
    initializeTheme();
  }, [initialize, initializeTheme]);

  // Show loading spinner during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ForgotPasswordPage />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ResetPasswordPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <TasksPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaskDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TeamDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/project/:projectId"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/team/:teamId"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-categorization"
            element={
              <ProtectedRoute>
                <Layout>
                  <AICategorizationPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />
          
          {/* Catch all route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Page not found
                  </p>
                  <button
                    onClick={() => window.history.back()}
                    className="btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: '',
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;