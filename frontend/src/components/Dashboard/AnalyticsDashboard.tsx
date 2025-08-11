import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, UsersIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import TaskStatusChart from '../Charts/TaskStatusChart';
import TaskProgressChart from '../Charts/TaskProgressChart';
import TeamWorkloadChart from '../Charts/TeamWorkloadChart';
import VelocityChart from '../Charts/VelocityChart';
import analyticsService, {
  TaskStatusAnalytics,
  TaskProgressAnalytics,
  TeamWorkloadAnalytics,
  VelocityAnalytics,
} from '../../services/analyticsService';

interface AnalyticsDashboardProps {
  projectId?: string;
  teamId?: string;
  title?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  teamId,
  title = 'Analytics Dashboard',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'team' | 'velocity'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  
  // Analytics data state
  const [taskStatusData, setTaskStatusData] = useState<TaskStatusAnalytics | null>(null);
  const [taskProgressData, setTaskProgressData] = useState<TaskProgressAnalytics[]>([]);
  const [teamWorkloadData, setTeamWorkloadData] = useState<TeamWorkloadAnalytics[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityAnalytics[]>([]);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [projectId, teamId, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll use sample data
      // In a real app, you would call the actual API endpoints
      
      // Load task status data
      const statusData = analyticsService.generateSampleTaskStatusData();
      setTaskStatusData(statusData);
      
      // Load progress data
      const progressData = analyticsService.generateSampleProgressData(
        timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      );
      setTaskProgressData(progressData);
      
      // Load team workload data (only if teamId is provided)
      if (teamId) {
        const workloadData = analyticsService.generateSampleTeamWorkloadData();
        setTeamWorkloadData(workloadData);
        
        const velocity = analyticsService.generateSampleVelocityData();
        setVelocityData(velocity);
      }
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'progress', name: 'Progress', icon: ArrowTrendingUpIcon },
    ...(teamId ? [
      { id: 'team', name: 'Team', icon: UsersIcon },
      { id: 'velocity', name: 'Velocity', icon: ClockIcon },
    ] : []),
  ];

  const renderSummaryCards = () => {
    if (!taskStatusData) return null;

    const totalTasks = Object.values(taskStatusData).reduce((sum, val) => sum + val, 0);
    const completedTasks = taskStatusData.done;
    const activeTasks = taskStatusData.in_progress + taskStatusData.in_review;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0';

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-300 font-bold">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon
                className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id
                    ? 'text-indigo-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && taskStatusData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-80">
                <TaskStatusChart 
                  data={taskStatusData}
                  chartType="doughnut"
                  title="Task Status Distribution"
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-80">
                <TaskStatusChart 
                  data={taskStatusData}
                  chartType="bar"
                  title="Task Status Breakdown"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && taskProgressData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-96">
              <TaskProgressChart
                data={taskProgressData}
                title="Task Completion Progress Over Time"
                timeRange={timeRange}
                showCompletionRate={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'team' && teamWorkloadData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-96">
              <TeamWorkloadChart
                data={teamWorkloadData}
                title="Team Workload Distribution"
                showWorkloadScore={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'velocity' && velocityData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-96">
              <VelocityChart
                data={velocityData}
                title="Team Velocity Trends"
                periodType="sprint"
                showTrend={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;