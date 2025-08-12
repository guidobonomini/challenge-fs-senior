import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  ArrowLeftIcon,
  UserPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTeamStore, TeamMember } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'member';
}

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentTeam, 
    currentTeamMembers, 
    fetchTeam, 
    fetchTeamMembers, 
    addTeamMember, 
    removeTeamMember,
    updateMemberRole,
    isLoading 
  } = useTeamStore();
  const { user } = useAuthStore();

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'member'>('member');

  // Helper functions to check user permissions
  const getCurrentUserRole = (): 'admin' | 'manager' | 'member' | null => {
    if (!user || !currentTeamMembers.length) return null;
    const currentMember = currentTeamMembers.find(member => member.user_id === user.id);
    return currentMember?.role || null;
  };

  const canManageMembers = (): boolean => {
    if (!user || !currentTeam) return false;
    
    // Global administrators can always manage members
    if (user.role === 'admin') return true;
    
    // Team owner can always manage members
    if (currentTeam.owner_id === user.id) return true;
    
    // Check if user is admin or manager in this team
    const userRole = getCurrentUserRole();
    return userRole === 'admin' || userRole === 'manager';
  };

  const canRemoveMember = (member: TeamMember): boolean => {
    if (!user || !currentTeam) return false;
    
    // Global administrators can remove anyone except team owners
    if (user.role === 'admin') {
      return currentTeam.owner_id !== member.user_id;
    }
    
    // Cannot remove yourself
    if (member.user_id === user.id) return false;
    
    // Cannot remove team owner
    if (currentTeam.owner_id === member.user_id) return false;
    
    // Team owner can remove anyone except themselves
    if (currentTeam.owner_id === user.id) return true;
    
    // Admins can remove members and managers
    const userRole = getCurrentUserRole();
    if (userRole === 'admin') {
      return member.role === 'member' || member.role === 'manager';
    }
    
    // Managers can only remove members
    if (userRole === 'manager') {
      return member.role === 'member';
    }
    
    return false;
  };

  const canUpdateMemberRole = (member: TeamMember): boolean => {
    if (!user || !currentTeam) return false;
    
    // Global administrators can change anyone's role except team owners
    if (user.role === 'admin') {
      return currentTeam.owner_id !== member.user_id;
    }
    
    // Cannot change your own role
    if (member.user_id === user.id) return false;
    
    // Cannot change team owner's role
    if (currentTeam.owner_id === member.user_id) return false;
    
    // Team owner can change anyone's role
    if (currentTeam.owner_id === user.id) return true;
    
    // Admins can change roles
    const userRole = getCurrentUserRole();
    if (userRole === 'admin') return true;
    
    // Managers can only promote members to managers
    if (userRole === 'manager') {
      return member.role === 'member';
    }
    
    return false;
  };

  const canEditTeam = (): boolean => {
    return canManageMembers();
  };

  useEffect(() => {
    if (id) {
      // Clear previous team data when navigating to a different team
      fetchTeam(id);
      fetchTeamMembers(id);
    }
  }, [id, fetchTeam, fetchTeamMembers]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiService.get<{users: User[]}>('/users/search', { 
        q: query,
        limit: 10 
      });
      // Filter out users who are already members
      const filteredUsers = response.users.filter(user => 
        !currentTeamMembers.some(member => member.user_id === user.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleAddMember = async (user: User) => {
    if (!id) return;
    
    try {
      await addTeamMember(id, user.id, selectedRole);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddMember(false);
      setSelectedRole('member');
      // Refresh team members
      await fetchTeamMembers(id);
      toast.success(`${user.first_name} ${user.last_name} added to the team`);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add team member');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!id) return;
    
    // Don't allow removing the team owner
    if (currentTeam?.owner_id === member.user_id) {
      toast.error('Cannot remove team owner');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${member.first_name} ${member.last_name} from the team?`)) {
      try {
        await removeTeamMember(id, member.user_id);
        toast.success('Member removed from team');
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove team member');
      }
    }
  };

  const handleUpdateRole = async (member: TeamMember, newRole: 'admin' | 'manager' | 'member') => {
    if (!id) return;
    
    try {
      await updateMemberRole(id, member.user_id, newRole);
      toast.success('Member role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    }
  };

  if (isLoading && !currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Team not found
          </h3>
          <button
            onClick={() => navigate('/teams')}
            className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/teams')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentTeam.name}
            </h1>
            {currentTeam.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {currentTeam.description}
              </p>
            )}
            {user && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Your role:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {currentTeam.owner_id === user.id ? 'Owner' : (getCurrentUserRole() ? getCurrentUserRole()!.charAt(0).toUpperCase() + getCurrentUserRole()!.slice(1) : 'Member')}
                </span>
              </div>
            )}
          </div>
          {canEditTeam() && (
            <button
              onClick={() => navigate(`/teams/${id}/edit`)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Team
            </button>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Members ({currentTeamMembers.length})
              </h2>
            </div>
            {canManageMembers() && (
              <button
                onClick={() => setShowAddMember(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </button>
            )}
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[99999]">
            <div className="relative top-24 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Add Team Member
                </h3>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedRole('member');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Role Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'manager' | 'member')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* User Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4 text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(user)}
                          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-4 text-gray-500">No users found</div>
                ) : (
                  <div className="text-center py-4 text-gray-500">Start typing to search users</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-3">
              {currentTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary-600 dark:text-primary-400 text-lg font-medium">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                        {currentTeam.owner_id === member.user_id && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                            Owner
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {canUpdateMemberRole(member) ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member, e.target.value as 'admin' | 'manager' | 'member')}
                        className="text-sm border border-gray-300 rounded px-3 py-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    )}
                    {canRemoveMember(member) && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove member"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {currentTeamMembers.length === 0 && !isLoading && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No members in this team yet.
                  {canManageMembers() && (
                    <p className="mt-2">Click "Add Member" to get started.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Projects Section (placeholder for future) */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Projects
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Team projects will be displayed here
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;