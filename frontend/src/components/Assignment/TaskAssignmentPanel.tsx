import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { 
  assignmentService, 
  TaskAssignment, 
  AssignmentHistory, 
  UserWorkload,
  AssignmentRequest 
} from '../../services/assignmentService';
import { useAuthStore } from '../../store/authStore';

interface TaskAssignmentPanelProps {
  taskId: string;
  teamId: string;
  onAssignmentChange?: () => void;
}

const TaskAssignmentPanel: React.FC<TaskAssignmentPanelProps> = ({
  taskId,
  teamId,
  onAssignmentChange,
}) => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [suggestions, setSuggestions] = useState<UserWorkload[]>([]);
  const [workloads, setWorkloads] = useState<UserWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'suggestions' | 'workloads' | 'history'>('current');

  useEffect(() => {
    loadAssignmentData();
  }, [taskId, teamId]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      
      const [assignmentData, suggestionsData, workloadsData] = await Promise.all([
        assignmentService.getTaskAssignments(taskId),
        assignmentService.getAssignmentSuggestions(taskId, 5),
        assignmentService.getTeamWorkloads(teamId),
      ]);

      setAssignments(assignmentData.assignments);
      setHistory(assignmentData.history);
      setSuggestions(suggestionsData);
      setWorkloads(workloadsData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string, role: 'assignee' | 'reviewer' | 'collaborator' = 'assignee', notes?: string) => {
    try {
      setAssigning(true);
      
      const assignmentRequest: AssignmentRequest = {
        user_id: userId,
        role,
        notes,
      };

      await assignmentService.assignUsersToTask(taskId, [assignmentRequest]);
      
      toast.success(`User assigned as ${assignmentService.getRoleDisplayName(role).toLowerCase()}`);
      
      await loadAssignmentData();
      onAssignmentChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign user');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignUser = async (userId: string, role: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      await assignmentService.unassignUserFromTask(taskId, userId, role);
      
      toast.success('User unassigned successfully');
      
      await loadAssignmentData();
      onAssignmentChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unassign user');
    }
  };

  const getUserDisplayName = (user: { first_name: string; last_name: string }) => {
    return `${user.first_name} ${user.last_name}`;
  };

  const getUserInitials = (user: { first_name: string; last_name: string }) => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'current', label: `Assigned (${assignments.length})`, icon: UserPlusIcon },
            { key: 'suggestions', label: 'Suggestions', icon: SparklesIcon },
            { key: 'workloads', label: 'Team Load', icon: ClockIcon },
            { key: 'history', label: `History (${history.length})`, icon: ExclamationTriangleIcon },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Current Assignments */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Assignments
          </h3>
          
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No one is assigned to this task yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(assignment => (
                <div
                  key={`${assignment.user_id}-${assignment.role}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {assignment.user.avatar_url ? (
                      <img
                        src={assignment.user.avatar_url}
                        alt={getUserDisplayName(assignment.user)}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getUserInitials(assignment.user)}
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName(assignment.user)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${assignmentService.getRoleColor(assignment.role)}`}>
                          {assignmentService.getRoleDisplayName(assignment.role)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {user && (user.role === 'admin' || ['admin', 'manager'].includes(user.role)) && (
                    <button
                      onClick={() => handleUnassignUser(assignment.user_id, assignment.role)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      title="Remove assignment"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Assignment Suggestions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on current workload and availability
          </p>
          
          <div className="space-y-3">
            {suggestions.map(suggestion => {
              const workloadStatus = assignmentService.getWorkloadStatus(suggestion);
              const isAlreadyAssigned = assignments.some(a => a.user_id === suggestion.user_id);
              
              return (
                <div
                  key={suggestion.user_id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {suggestion.avatar_url ? (
                      <img
                        src={suggestion.avatar_url}
                        alt={`${suggestion.first_name} ${suggestion.last_name}`}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getUserInitials(suggestion)}
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName(suggestion)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${workloadStatus.color}`}>
                          {workloadStatus.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {suggestion.active_tasks} active tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isAlreadyAssigned && user && (user.role === 'admin' || ['admin', 'manager'].includes(user.role)) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAssignUser(suggestion.user_id, 'assignee')}
                        disabled={assigning}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                  
                  {isAlreadyAssigned && (
                    <span className="text-xs text-green-600 font-medium">Already Assigned</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Workloads */}
      {activeTab === 'workloads' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Team Workload Overview
          </h3>
          
          <div className="space-y-3">
            {workloads.map(workload => {
              const workloadStatus = assignmentService.getWorkloadStatus(workload);
              
              return (
                <div
                  key={workload.user_id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {workload.avatar_url ? (
                        <img
                          src={workload.avatar_url}
                          alt={getUserDisplayName(workload)}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getUserInitials(workload)}
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getUserDisplayName(workload)}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${workloadStatus.color}`}>
                          {workloadStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {workload.active_tasks}
                      </div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-600">
                        {workload.high_priority_tasks}
                      </div>
                      <div className="text-xs text-gray-500">High Priority</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {workload.overdue_tasks}
                      </div>
                      <div className="text-xs text-gray-500">Overdue</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        {workload.workload_score}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assignment History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Assignment History
          </h3>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No assignment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {getUserInitials(item.user)}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{getUserDisplayName(item.user)}</span>
                        {' '}
                        {assignmentService.formatAssignmentAction(item.action)}
                        {item.new_role && (
                          <>
                            {' as '}
                            <span className="font-medium">
                              {assignmentService.getRoleDisplayName(item.new_role)}
                            </span>
                          </>
                        )}
                        {' by '}
                        <span className="font-medium">{getUserDisplayName(item.changed_by_user)}</span>
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            • {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskAssignmentPanel;