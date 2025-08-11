import React, { useState, useRef } from 'react';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  PaintBrushIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { isDark, toggle: toggleTheme, setDark } = useThemeStore();
  
  // State for form management
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    task_assignments: true,
    task_updates: true,
    project_updates: true,
    team_invitations: true,
    due_date_reminders: true,
    weekly_digest: false,
  });

  const [preferenceSettings, setPreferenceSettings] = useState({
    default_task_view: 'kanban' as 'kanban' | 'list' | 'calendar',
    items_per_page: 25,
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    time_format: '12h' as '12h' | '24h',
    language: 'en',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'account', name: 'Account', icon: CogIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement password change API call
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload logic
      console.log('Uploading avatar:', file);
      toast.success('Avatar upload feature coming soon!');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      toast.error('Account deletion feature coming soon!');
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement notification settings save
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement preferences save
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Profile Picture
              </h3>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Change Avatar
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    JPG, GIF or PNG. Max size of 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {user?.email_verified ? (
                        <span className="inline-flex items-center text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Email verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 dark:text-red-400">
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Email not verified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user?.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {user?.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Application Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Task View
                  </label>
                  <select
                    value={preferenceSettings.default_task_view}
                    onChange={(e) => setPreferenceSettings({
                      ...preferenceSettings,
                      default_task_view: e.target.value as 'kanban' | 'list' | 'calendar'
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="kanban">Kanban Board</option>
                    <option value="list">List View</option>
                    <option value="calendar">Calendar View</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items Per Page
                  </label>
                  <select
                    value={preferenceSettings.items_per_page}
                    onChange={(e) => setPreferenceSettings({
                      ...preferenceSettings,
                      items_per_page: parseInt(e.target.value)
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferenceSettings.date_format}
                      onChange={(e) => setPreferenceSettings({
                        ...preferenceSettings,
                        date_format: e.target.value
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferenceSettings.time_format}
                      onChange={(e) => setPreferenceSettings({
                        ...preferenceSettings,
                        time_format: e.target.value as '12h' | '24h'
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={savePreferences}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-red-400">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
                Danger Zone
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Notification Preferences
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Email Notifications
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'email_notifications', label: 'Enable Email Notifications', description: 'Receive notifications via email' },
                    { key: 'task_assignments', label: 'Task Assignments', description: 'When you are assigned to a task' },
                    { key: 'task_updates', label: 'Task Updates', description: 'When tasks you are involved in are updated' },
                    { key: 'project_updates', label: 'Project Updates', description: 'When projects you are part of are updated' },
                    { key: 'team_invitations', label: 'Team Invitations', description: 'When you are invited to join a team' },
                    { key: 'due_date_reminders', label: 'Due Date Reminders', description: 'Reminders for upcoming task deadlines' },
                    { key: 'weekly_digest', label: 'Weekly Digest', description: 'Weekly summary of your activity' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [setting.key]: e.target.checked
                          })}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {setting.label}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={saveNotificationSettings}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Appearance Settings
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Theme
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setDark(false)}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      !isDark 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <SunIcon className="h-8 w-8 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                  </button>
                  
                  <button
                    onClick={() => setDark(true)}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      isDark 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <MoonIcon className="h-8 w-8 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                  </button>
                  
                  <button
                    onClick={toggleTheme}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 rounded-lg flex flex-col items-center space-y-2 transition-all"
                  >
                    <ComputerDesktopIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Preview
                </h4>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Sample Task Card</h5>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This is how your interface will look with the current theme settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={`${user.first_name} ${user.last_name}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user.email} • {user.role}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;