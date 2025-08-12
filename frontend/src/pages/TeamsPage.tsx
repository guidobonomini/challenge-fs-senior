import React, { useEffect, useState } from 'react';
import { useTeamStore, Team } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import TeamModal from '../components/Teams/TeamModal';

const TeamsPage: React.FC = () => {
  const { teams, isLoading, error, fetchTeams, fetchTeam, fetchTeamMembers, createTeam, updateTeam, deleteTeam } = useTeamStore();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams({ limit: 100 });
  }, [fetchTeams]);

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = async (team: Team) => {
    try {
      // Fetch full team details and members
      await fetchTeam(team.id);
      await fetchTeamMembers(team.id);
      setSelectedTeam(team);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (deleteConfirm === teamId) {
      await deleteTeam(teamId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(teamId);
      // Auto-cancel delete confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teams
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your teams and collaborate with team members ({teams.length} teams)
          </p>
        </div>
        <button
          onClick={handleCreateTeam}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12">
          <div className="text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Teams Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first team to collaborate with others.
            </p>
            <button
              onClick={handleCreateTeam}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mr-3">
                      <UserGroupIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {team.member_count || 0} members
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {team.project_count || 0} projects
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {team.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    team.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {team.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  Created {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {/* Show edit button for global admins or team admins/managers */}
                    {(user?.role === 'admin' || team.member_role === 'admin' || team.member_role === 'manager') && (
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Edit team"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {/* Settings button for all members */}
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded-md transition-colors"
                      title="Team settings"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    {/* Show delete button for global admins or team admins */}
                    {(user?.role === 'admin' || team.member_role === 'admin') && (
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className={`p-2 rounded-md transition-colors ${
                          deleteConfirm === team.id
                            ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                        title={deleteConfirm === team.id ? 'Click again to confirm delete' : 'Delete team'}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Team members avatars preview */}
                  {team.members && team.members.length > 0 && (
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 3).map((member) => (
                        <div
                          key={member.user_id}
                          className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800"
                        >
                          {member.first_name?.[0] || member.email?.[0] || '?'}
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 ring-2 ring-white dark:ring-gray-800">
                          +{team.members.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        team={selectedTeam}
      />
    </div>
  );
};

export default TeamsPage;