import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskFilters, { TaskFilterOptions } from './TaskFilters';

// Mock lodash debounce
jest.mock('lodash', () => ({
  debounce: (fn: any) => fn,
}));

describe('TaskFilters', () => {
  const mockProps = {
    filters: {},
    onFiltersChange: jest.fn(),
    onClearFilters: jest.fn(),
    availableUsers: [
      { id: 'user-1', first_name: 'John', last_name: 'Doe' },
      { id: 'user-2', first_name: 'Jane', last_name: 'Smith' },
    ],
    availableProjects: [
      { id: 'project-1', name: 'Project A' },
      { id: 'project-2', name: 'Project B' },
    ],
  };

  beforeEach(() => {
    mockProps.onFiltersChange.mockClear();
    mockProps.onClearFilters.mockClear();
  });

  it('should render with collapsed state by default', () => {
    render(<TaskFilters {...mockProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    
    // Advanced filters should not be visible
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority')).not.toBeInTheDocument();
  });

  it('should show active filter count', () => {
    const filtersWithData: TaskFilterOptions = {
      search: 'test',
      status: ['todo', 'in_progress'],
      priority: ['high'],
    };

    render(<TaskFilters {...mockProps} filters={filtersWithData} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Filter count badge
  });

  it('should handle search input changes', async () => {
    render(<TaskFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      search: 'test search',
    });
  });

  it('should expand and show all filter options', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Click expand button
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="funnel-icon"], .h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Due Date Range')).toBeInTheDocument();
  });

  it('should handle status filter changes', async () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Click on "To Do" status
    const todoCheckbox = screen.getByRole('checkbox', { name: /to do/i });
    fireEvent.click(todoCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      status: ['todo'],
    });
  });

  it('should handle priority filter changes', async () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Click on "High" priority
    const highPriorityCheckbox = screen.getByRole('checkbox', { name: /high/i });
    fireEvent.click(highPriorityCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      priority: ['high'],
    });
  });

  it('should handle assignee filter changes', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Click on John Doe
    const johnCheckbox = screen.getByRole('checkbox', { name: /john doe/i });
    fireEvent.click(johnCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      assignee_id: ['user-1'],
    });
  });

  it('should handle project filter changes', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Click on Project A
    const projectACheckbox = screen.getByRole('checkbox', { name: /project a/i });
    fireEvent.click(projectACheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      project_id: ['project-1'],
    });
  });

  it('should handle date range changes', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Find due date inputs
    const dateInputs = screen.getAllByDisplayValue('');
    const fromInput = dateInputs[0];
    const toInput = dateInputs[1];
    
    fireEvent.change(fromInput, { target: { value: '2023-01-01' } });
    fireEvent.change(toInput, { target: { value: '2023-12-31' } });
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      due_date_from: '2023-01-01',
    });
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      due_date_to: '2023-12-31',
    });
  });

  it('should handle story points range changes', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Find story points inputs
    const minInput = screen.getByPlaceholderText('Min');
    const maxInput = screen.getByPlaceholderText('Max');
    
    fireEvent.change(minInput, { target: { value: '1' } });
    fireEvent.change(maxInput, { target: { value: '8' } });
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      story_points_min: 1,
    });
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      story_points_max: 8,
    });
  });

  it('should handle boolean filter changes', () => {
    render(<TaskFilters {...mockProps} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Click on "Has attachments" checkbox
    const hasAttachmentsCheckbox = screen.getByRole('checkbox', { name: /has attachments/i });
    fireEvent.click(hasAttachmentsCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      has_attachments: true,
    });
  });

  it('should show clear all button when filters are active', () => {
    const filtersWithData: TaskFilterOptions = {
      search: 'test',
      status: ['todo'],
    };

    render(<TaskFilters {...mockProps} filters={filtersWithData} />);
    
    const clearAllButton = screen.getByText('Clear all');
    expect(clearAllButton).toBeInTheDocument();
    
    fireEvent.click(clearAllButton);
    expect(mockProps.onClearFilters).toHaveBeenCalled();
  });

  it('should remove filter when unchecked', () => {
    const initialFilters: TaskFilterOptions = {
      status: ['todo', 'in_progress'],
    };

    render(<TaskFilters {...mockProps} filters={initialFilters} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    // Uncheck "To Do"
    const todoCheckbox = screen.getByRole('checkbox', { name: /to do/i });
    expect(todoCheckbox).toBeChecked();
    
    fireEvent.click(todoCheckbox);
    
    expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
      status: ['in_progress'],
    });
  });

  it('should not show assignee section when no users available', () => {
    render(<TaskFilters {...mockProps} availableUsers={[]} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    expect(screen.queryByText('Assignee')).not.toBeInTheDocument();
  });

  it('should not show project section when no projects available', () => {
    render(<TaskFilters {...mockProps} availableProjects={[]} />);
    
    // Expand filters
    const expandButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('.h-5.w-5')
    );
    fireEvent.click(expandButton!);
    
    expect(screen.queryByText('Project')).not.toBeInTheDocument();
  });
});