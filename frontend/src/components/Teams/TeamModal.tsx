import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTeamStore, Team, TeamMember } from '../../store/teamStore';
import { apiService } from '../../services/api';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team | null;
}

interface TeamFormData {
  name: string;
  description: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, team }) => {
  const { createTeam, updateTeam, addTeamMember, removeTeamMember, updateMemberRole, isLoading, currentTeamMembers } = useTeamStore();
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (team) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
        });
        // Use currentTeamMembers from the store if available, otherwise use team.members
        setMembers(currentTeamMembers.length > 0 ? currentTeamMembers : (team.members || []));
      } else {
        setFormData({
          name: '',
          description: '',
        });
        setMembers([]);
      }
      setErrors({});
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [isOpen, team, currentTeamMembers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        !members.some(member => member.user_id === user.id)
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

  const addMemberToList = (user: User, role: 'admin' | 'manager' | 'member' = 'member') => {
    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      team_id: team?.id || '',
      role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      avatar_url: user.avatar_url,
    };
    
    setMembers(prev => [...prev, newMember]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeMemberFromList = (userId: string) => {
    setMembers(prev => prev.filter(member => member.user_id !== userId));
  };

  const updateMemberRoleInList = (userId: string, newRole: 'admin' | 'manager' | 'member') => {
    setMembers(prev => prev.map(member => 
      member.user_id === userId ? { ...member, role: newRole } : member
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description || undefined,
      };

      let teamId: string;
      
      if (team) {
        await updateTeam(team.id, submitData);
        teamId = team.id;
        
        // Handle member changes for existing team
        try {
          const existingMembers = team.members || currentTeamMembers || [];
          const existingMemberIds = existingMembers.map(m => m.user_id);
          const newMemberIds = members.map(m => m.user_id);
          
          // Add new members
          for (const member of members) {
            if (!existingMemberIds.includes(member.user_id)) {
              try {
                await addTeamMember(teamId, member.user_id, member.role);
              } catch (error) {
                console.error(`Failed to add member ${member.email}:`, error);
                // Continue with other operations
              }
            }
          }
          
          // Remove members that are no longer in the list
          for (const existingMemberId of existingMemberIds) {
            if (!newMemberIds.includes(existingMemberId)) {
              try {
                await removeTeamMember(teamId, existingMemberId);
              } catch (error) {
                console.error(`Failed to remove member ${existingMemberId}:`, error);
                // Continue with other operations
              }
            }
          }
          
          // Update roles for existing members
          for (const member of members) {
            const existingMember = existingMembers.find(m => m.user_id === member.user_id);
            if (existingMember && existingMember.role !== member.role) {
              try {
                await updateMemberRole(teamId, member.user_id, member.role);
              } catch (error) {
                console.error(`Failed to update role for member ${member.email}:`, error);
                // Continue with other operations
              }
            }
          }
        } catch (error) {
          console.error('Error handling member changes:', error);
          // Don't throw - the team update was successful, member changes are secondary
        }
      } else {
        teamId = await createTeam(submitData);
        
        // Add members to newly created team
        for (const member of members) {
          try {
            await addTeamMember(teamId, member.user_id, member.role);
          } catch (error) {
            console.error(`Failed to add member ${member.email}:`, error);
            // Continue adding other members even if one fails
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  if (!isOpen) return null;

  return (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[99999]">
              <div className="relative top-24 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {team ? 'Edit Team' : 'Create New Team'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Team Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter team name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter team description"
              />
            </div>
          </div>

          {/* Team Members Section - Always show but conditionally allow editing */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Team Members ({members.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-200 dark:hover:bg-primary-800"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Member
              </button>
            </div>

            {/* User Search */}
            {showSearch && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
                
                {/* Search Results */}
                {searchQuery && (
                  <div className="mt-2 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="text-center py-2 text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                                <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
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
                              type="button"
                              onClick={() => addMemberToList(user)}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500">No users found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRoleInList(member.user_id, e.target.value as 'admin' | 'manager' | 'member')}
                      className="text-xs border border-gray-300 rounded px-2 py-1 dark:bg-gray-600 dark:border-gray-500 dark:text-white relative z-10"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMemberFromList(member.user_id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No members added yet. Click "Add Member" to get started.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;