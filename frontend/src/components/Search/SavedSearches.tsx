import React, { useState, useEffect } from 'react';
import { 
  BookmarkIcon, 
  PlusIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { TaskFilterOptions } from '../Filters/TaskFilters';
import { SortConfig } from '../Sorting/SortableColumn';

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: TaskFilterOptions;
  sort?: SortConfig | null;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SavedSearchesProps {
  currentFilters: TaskFilterOptions;
  currentSort: SortConfig | null;
  onApplySearch: (search: SavedSearch) => void;
  onSaveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteSearch: (searchId: string) => void;
  onUpdateSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  className?: string;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentFilters,
  currentSort,
  onApplySearch,
  onSaveSearch,
  onDeleteSearch,
  onUpdateSearch,
  className = '',
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedTaskSearches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved searches:', error);
      }
    }
  }, []);

  // Save searches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedTaskSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  const handleSaveCurrentSearch = () => {
    if (!newSearchName.trim()) return;

    const newSearch: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newSearchName.trim(),
      description: newSearchDescription.trim() || undefined,
      filters: currentFilters,
      sort: currentSort,
      isDefault: false,
    };

    const savedSearch: SavedSearch = {
      ...newSearch,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedSearches(prev => [...prev, savedSearch]);
    onSaveSearch(newSearch);
    
    setNewSearchName('');
    setNewSearchDescription('');
    setShowSaveDialog(false);
  };

  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    onDeleteSearch(searchId);
  };

  const handleSetDefault = (searchId: string) => {
    setSavedSearches(prev => prev.map(search => ({
      ...search,
      isDefault: search.id === searchId,
    })));

    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      onUpdateSearch(searchId, { isDefault: true });
    }
  };

  const getFilterSummary = (filters: TaskFilterOptions): string => {
    const parts: string[] = [];
    
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.status?.length) parts.push(`Status: ${filters.status.join(', ')}`);
    if (filters.priority?.length) parts.push(`Priority: ${filters.priority.join(', ')}`);
    if (filters.type?.length) parts.push(`Type: ${filters.type.join(', ')}`);
    if (filters.assignee_id?.length) parts.push(`Assignees: ${filters.assignee_id.length}`);
    if (filters.project_id?.length) parts.push(`Projects: ${filters.project_id.length}`);
    if (filters.due_date_from || filters.due_date_to) {
      parts.push(`Due: ${filters.due_date_from || 'any'} - ${filters.due_date_to || 'any'}`);
    }
    if (filters.has_attachments) parts.push('Has attachments');
    if (filters.has_comments) parts.push('Has comments');
    if (filters.is_overdue) parts.push('Overdue');

    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  const hasActiveFilters = () => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof TaskFilterOptions];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookmarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Saved Searches</h3>
        </div>
        
        {hasActiveFilters() && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Save Current
          </button>
        )}
      </div>

      {/* Saved Searches List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {savedSearches.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookmarkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved searches yet</p>
            <p className="text-xs">Create filters and save them for quick access</p>
          </div>
        ) : (
          savedSearches.map(search => (
            <div
              key={search.id}
              className="group flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <button
                onClick={() => onApplySearch(search)}
                className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {search.name}
                  </span>
                  {search.isDefault && (
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                
                {search.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                    {search.description}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ml-6 truncate">
                  {getFilterSummary(search.filters)}
                </p>
                
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 ml-6">
                  Saved {new Date(search.createdAt).toLocaleDateString()}
                </p>
              </button>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!search.isDefault && (
                  <button
                    onClick={() => handleSetDefault(search.id)}
                    className="p-1 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400"
                    title="Set as default"
                  >
                    <StarIcon className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  title="Delete search"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Save Current Search
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Name *
                </label>
                <input
                  type="text"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  placeholder="Enter search name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newSearchDescription}
                  onChange={(e) => setNewSearchDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Current filters:</p>
                <p className="text-sm text-gray-800 dark:text-gray-300">
                  {getFilterSummary(currentFilters)}
                </p>
                {currentSort && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Sorted by: {currentSort.field} ({currentSort.direction})
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveCurrentSearch}
                disabled={!newSearchName.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Search
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewSearchName('');
                  setNewSearchDescription('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;