import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskFilterOptions } from '../components/Filters/TaskFilters';
import { SortConfig } from '../components/Sorting/SortableColumn';
import { PaginationData } from '../components/Pagination/Pagination';

export interface TableDataState {
  filters: TaskFilterOptions;
  sort: SortConfig | null;
  pagination: PaginationData;
}

interface UseTableDataOptions {
  defaultLimit?: number;
  defaultSort?: SortConfig;
  defaultFilters?: TaskFilterOptions;
  syncWithUrl?: boolean;
  urlPrefix?: string;
}

interface UseTableDataReturn {
  // State
  filters: TaskFilterOptions;
  sort: SortConfig | null;
  pagination: PaginationData;
  
  // Actions
  updateFilters: (newFilters: TaskFilterOptions) => void;
  clearFilters: () => void;
  updateSort: (field: string, direction: 'asc' | 'desc') => void;
  clearSort: () => void;
  updatePagination: (updates: Partial<PaginationData>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;
  
  // Derived state
  hasActiveFilters: boolean;
  queryParams: Record<string, string | string[]>;
}

export const useTableData = (options: UseTableDataOptions = {}): UseTableDataReturn => {
  const {
    defaultLimit = 25,
    defaultSort,
    defaultFilters = {},
    syncWithUrl = true,
    urlPrefix = '',
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params or defaults
  const getInitialState = useCallback((): TableDataState => {
    if (!syncWithUrl) {
      return {
        filters: defaultFilters,
        sort: defaultSort || null,
        pagination: {
          page: 1,
          limit: defaultLimit,
          total: 0,
          pages: 0,
        },
      };
    }

    const filters: TaskFilterOptions = {};
    
    // Parse filters from URL
    const searchParam = searchParams.get(`${urlPrefix}search`);
    if (searchParam) filters.search = searchParam;

    const statusParam = searchParams.get(`${urlPrefix}status`);
    if (statusParam) filters.status = statusParam.split(',') as any;

    const priorityParam = searchParams.get(`${urlPrefix}priority`);
    if (priorityParam) filters.priority = priorityParam.split(',') as any;

    const assigneeParam = searchParams.get(`${urlPrefix}assignee`);
    if (assigneeParam) filters.assignee_id = assigneeParam.split(',');

    const projectParam = searchParams.get(`${urlPrefix}project`);
    if (projectParam) filters.project_id = projectParam.split(',');

    const dueDateFromParam = searchParams.get(`${urlPrefix}due_from`);
    if (dueDateFromParam) filters.due_date_from = dueDateFromParam;

    const dueDateToParam = searchParams.get(`${urlPrefix}due_to`);
    if (dueDateToParam) filters.due_date_to = dueDateToParam;

    const createdFromParam = searchParams.get(`${urlPrefix}created_from`);
    if (createdFromParam) filters.created_from = createdFromParam;

    const createdToParam = searchParams.get(`${urlPrefix}created_to`);
    if (createdToParam) filters.created_to = createdToParam;

    const hasAttachmentsParam = searchParams.get(`${urlPrefix}has_attachments`);
    if (hasAttachmentsParam) filters.has_attachments = hasAttachmentsParam === 'true';

    const hasCommentsParam = searchParams.get(`${urlPrefix}has_comments`);
    if (hasCommentsParam) filters.has_comments = hasCommentsParam === 'true';

    const isOverdueParam = searchParams.get(`${urlPrefix}is_overdue`);
    if (isOverdueParam) filters.is_overdue = isOverdueParam === 'true';

    // Parse sort from URL
    let sort: SortConfig | null = defaultSort || null;
    const sortParam = searchParams.get(`${urlPrefix}sort`);
    if (sortParam) {
      const [field, direction] = sortParam.split(':');
      if (field && (direction === 'asc' || direction === 'desc')) {
        sort = { field, direction };
      }
    }

    // Parse pagination from URL
    const pageParam = searchParams.get(`${urlPrefix}page`);
    const limitParam = searchParams.get(`${urlPrefix}limit`);

    return {
      filters,
      sort,
      pagination: {
        page: pageParam ? parseInt(pageParam, 10) : 1,
        limit: limitParam ? parseInt(limitParam, 10) : defaultLimit,
        total: 0,
        pages: 0,
      },
    };
  }, [searchParams, defaultFilters, defaultSort, defaultLimit, syncWithUrl, urlPrefix]);

  const [state, setState] = useState<TableDataState>(getInitialState);

  // Update URL when state changes
  const updateUrl = useCallback((newState: TableDataState) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams);

    // Clear existing params
    Array.from(params.keys())
      .filter(key => key.startsWith(urlPrefix))
      .forEach(key => params.delete(key));

    // Add filter params
    Object.entries(newState.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params.set(`${urlPrefix}${key}`, value.join(','));
        } else if (!Array.isArray(value)) {
          params.set(`${urlPrefix}${key}`, String(value));
        }
      }
    });

    // Add sort param
    if (newState.sort) {
      params.set(`${urlPrefix}sort`, `${newState.sort.field}:${newState.sort.direction}`);
    }

    // Add pagination params
    if (newState.pagination.page !== 1) {
      params.set(`${urlPrefix}page`, String(newState.pagination.page));
    }
    if (newState.pagination.limit !== defaultLimit) {
      params.set(`${urlPrefix}limit`, String(newState.pagination.limit));
    }

    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, syncWithUrl, urlPrefix, defaultLimit]);

  // Actions
  const updateFilters = useCallback((newFilters: TaskFilterOptions) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        filters: newFilters,
        pagination: {
          ...prevState.pagination,
          page: 1, // Reset to first page when filters change
        },
      };
      updateUrl(newState);
      return newState;
    });
  }, [updateUrl]);

  const clearFilters = useCallback(() => {
    setState(prevState => {
      const newState = {
        ...prevState,
        filters: {},
        pagination: {
          ...prevState.pagination,
          page: 1,
        },
      };
      updateUrl(newState);
      return newState;
    });
  }, [updateUrl]);

  const updateSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setState(prevState => {
      const newState = {
        ...prevState,
        sort: { field, direction },
        pagination: {
          ...prevState.pagination,
          page: 1, // Reset to first page when sort changes
        },
      };
      updateUrl(newState);
      return newState;
    });
  }, [updateUrl]);

  const clearSort = useCallback(() => {
    setState(prevState => {
      const newState = {
        ...prevState,
        sort: null,
      };
      updateUrl(newState);
      return newState;
    });
  }, [updateUrl]);

  const updatePagination = useCallback((updates: Partial<PaginationData>) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        pagination: {
          ...prevState.pagination,
          ...updates,
        },
      };
      updateUrl(newState);
      return newState;
    });
  }, [updateUrl]);

  const setPage = useCallback((page: number) => {
    updatePagination({ page });
  }, [updatePagination]);

  const setLimit = useCallback((limit: number) => {
    updatePagination({ limit, page: 1 }); // Reset to first page when changing limit
  }, [updatePagination]);

  const resetPagination = useCallback(() => {
    updatePagination({ page: 1 });
  }, [updatePagination]);

  // Derived state
  const hasActiveFilters = useMemo(() => {
    return Object.keys(state.filters).some(key => {
      const value = state.filters[key as keyof TaskFilterOptions];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }, [state.filters]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | string[]> = {};
    
    // Add filters
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          params[key] = value;
        } else if (!Array.isArray(value)) {
          params[key] = String(value);
        }
      }
    });

    // Add sort
    if (state.sort) {
      params.sort_by = state.sort.field;
      params.sort_order = state.sort.direction;
    }

    // Add pagination
    params.page = String(state.pagination.page);
    params.limit = String(state.pagination.limit);

    return params;
  }, [state]);

  return {
    // State
    filters: state.filters,
    sort: state.sort,
    pagination: state.pagination,
    
    // Actions
    updateFilters,
    clearFilters,
    updateSort,
    clearSort,
    updatePagination,
    setPage,
    setLimit,
    resetPagination,
    
    // Derived state
    hasActiveFilters,
    queryParams,
  };
};

export default useTableData;