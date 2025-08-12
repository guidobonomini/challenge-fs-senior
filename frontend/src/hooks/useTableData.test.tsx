import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useTableData } from './useTableData';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => {
    const searchParams = new URLSearchParams();
    const setSearchParams = jest.fn();
    return [searchParams, setSearchParams];
  },
}));

describe('useTableData', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTableData(), { wrapper });

    expect(result.current.filters).toEqual({});
    expect(result.current.sort).toBeNull();
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 25,
      total: 0,
      pages: 0,
    });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should initialize with custom default values', () => {
    const defaultFilters = { search: 'test' };
    const defaultSort = { field: 'title', direction: 'asc' as const };
    const defaultLimit = 50;

    const { result } = renderHook(() => 
      useTableData({
        defaultFilters,
        defaultSort,
        defaultLimit,
        syncWithUrl: false,
      }), 
      { wrapper }
    );

    expect(result.current.filters).toEqual(defaultFilters);
    expect(result.current.sort).toEqual(defaultSort);
    expect(result.current.pagination.limit).toBe(defaultLimit);
  });

  it('should update filters correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ search: 'test', status: ['todo'] });
    });

    expect(result.current.filters).toEqual({
      search: 'test',
      status: ['todo'],
    });
    expect(result.current.pagination.page).toBe(1); // Should reset to page 1
  });

  it('should clear filters correctly', () => {
    const { result } = renderHook(() => 
      useTableData({ 
        defaultFilters: { search: 'test' },
        syncWithUrl: false 
      }), 
      { wrapper }
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('should update sort correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateSort('title', 'desc');
    });

    expect(result.current.sort).toEqual({
      field: 'title',
      direction: 'desc',
    });
    expect(result.current.pagination.page).toBe(1); // Should reset to page 1
  });

  it('should clear sort correctly', () => {
    const { result } = renderHook(() => 
      useTableData({ 
        defaultSort: { field: 'title', direction: 'asc' },
        syncWithUrl: false 
      }), 
      { wrapper }
    );

    act(() => {
      result.current.clearSort();
    });

    expect(result.current.sort).toBeNull();
  });

  it('should update pagination correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updatePagination({ page: 2, total: 100, pages: 4 });
    });

    expect(result.current.pagination).toEqual({
      page: 2,
      limit: 25,
      total: 100,
      pages: 4,
    });
  });

  it('should set page correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.pagination.page).toBe(3);
  });

  it('should set limit and reset page', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    // First set a different page
    act(() => {
      result.current.setPage(3);
    });

    // Then change limit
    act(() => {
      result.current.setLimit(50);
    });

    expect(result.current.pagination.limit).toBe(50);
    expect(result.current.pagination.page).toBe(1); // Should reset to page 1
  });

  it('should reset pagination correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    // Set pagination to non-default values
    act(() => {
      result.current.updatePagination({ page: 3, total: 100, pages: 4 });
    });

    // Reset pagination
    act(() => {
      result.current.resetPagination();
    });

    expect(result.current.pagination.page).toBe(1);
  });

  it('should detect active filters correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.updateFilters({ search: '' });
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should handle array filters correctly for active detection', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ status: ['todo', 'in_progress'] });
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.updateFilters({ status: [] });
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should generate query params correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ 
        search: 'test',
        status: ['todo', 'in_progress'],
        priority: ['high'],
      });
      result.current.updateSort('created_at', 'desc');
      result.current.updatePagination({ page: 2, limit: 50 });
    });

    const queryParams = result.current.queryParams;

    expect(queryParams).toEqual({
      search: 'test',
      status: ['todo', 'in_progress'],
      priority: ['high'],
      sort_by: 'created_at',
      sort_order: 'desc',
      page: '2',
      limit: '50',
    });
  });

  it('should not include empty values in query params', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ 
        search: '',
        status: [],
        priority: ['high'],
      });
    });

    const queryParams = result.current.queryParams;

    expect(queryParams.search).toBeUndefined();
    expect(queryParams.status).toBeUndefined();
    expect(queryParams.priority).toEqual(['high']);
  });

  it('should handle boolean filters correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ 
        has_attachments: true,
        has_comments: false,
      });
    });

    expect(result.current.hasActiveFilters).toBe(true);
    
    const queryParams = result.current.queryParams;
    expect(queryParams.has_attachments).toBe('true');
    expect(queryParams.has_comments).toBe('false');
  });

  it('should handle numeric filters correctly', () => {
    const { result } = renderHook(() => useTableData({ syncWithUrl: false }), { wrapper });

    act(() => {
      result.current.updateFilters({ 
        search: 'test query',
        status: ['todo'],
      });
    });

    expect(result.current.hasActiveFilters).toBe(true);
    
    const queryParams = result.current.queryParams;
    expect(queryParams.search).toBe('test query');
    expect(queryParams.status).toEqual(['todo']);
  });
});