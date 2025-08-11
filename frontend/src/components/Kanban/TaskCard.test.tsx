import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskCard from './TaskCard';
import { createMockTask } from '../../test-utils';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

const renderTaskCard = (taskProps = {}, onEditTask?: (task: any) => void) => {
  const mockTask = createMockTask(taskProps);
  
  return render(
    <BrowserRouter>
      <TaskCard task={mockTask} onEditTask={onEditTask} />
    </BrowserRouter>
  );
};

describe('TaskCard', () => {
  it('should render task information correctly', () => {
    const task = {
      title: 'Test Task',
      description: 'Test description',
      priority: 'high' as const,
      type: 'bug' as const,
      story_points: 5,
    };

    renderTaskCard(task);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display correct type icon', () => {
    renderTaskCard({ type: 'bug' });
    
    // Bug type should show 🐛 icon
    expect(screen.getByText('🐛')).toBeInTheDocument();
  });

  it('should display priority with correct styling', () => {
    renderTaskCard({ priority: 'critical' });
    
    const priorityElement = screen.getByText('critical');
    expect(priorityElement).toBeInTheDocument();
    expect(priorityElement).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should display assignee information', () => {
    const task = {
      assignee: {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        avatar_url: null,
      },
    };

    renderTaskCard(task);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
  });

  it('should display due date', () => {
    renderTaskCard({ due_date: '2022-12-25T00:00:00Z' });
    
    expect(screen.getByText('2022-01-01')).toBeInTheDocument(); // Mocked format function
  });

  it('should display comment count', () => {
    renderTaskCard({ comment_count: 3 });
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display attachment count', () => {
    renderTaskCard({ attachment_count: 2 });
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display time estimate in hours', () => {
    renderTaskCard({ time_estimate: 7200 }); // 2 hours in seconds
    
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('should call onEditTask when clicked with edit handler', () => {
    const mockOnEditTask = jest.fn();
    const task = createMockTask();
    
    render(
      <BrowserRouter>
        <TaskCard task={task} onEditTask={mockOnEditTask} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnEditTask).toHaveBeenCalledWith(task);
  });

  it('should not call onEditTask for temporary tasks', () => {
    const mockOnEditTask = jest.fn();
    const task = createMockTask({ id: 'temp-123' });
    
    render(
      <BrowserRouter>
        <TaskCard task={task} onEditTask={mockOnEditTask} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnEditTask).not.toHaveBeenCalled();
  });

  it('should display optimistic update styling', () => {
    const task = createMockTask();
    (task as any)._optimistic = true;
    
    render(
      <BrowserRouter>
        <TaskCard task={task} />
      </BrowserRouter>
    );

    const taskElement = screen.getByRole('button');
    expect(taskElement).toHaveClass('optimistic-update');
  });

  it('should display creating optimistic styling for temp tasks', () => {
    const task = createMockTask({ id: 'temp-123' });
    (task as any)._optimistic = true;
    
    render(
      <BrowserRouter>
        <TaskCard task={task} />
      </BrowserRouter>
    );

    const taskElement = screen.getByRole('button');
    expect(taskElement).toHaveClass('optimistic-update', 'optimistic-creating');
  });

  it('should not render description if empty', () => {
    renderTaskCard({ description: '' });
    
    // Description paragraph should not be in the document
    expect(screen.queryByText(/Test task description/)).not.toBeInTheDocument();
  });

  it('should not render assignee section if no assignee', () => {
    renderTaskCard({ assignee: null, assignee_id: null });
    
    // Assignee section should not be rendered
    expect(screen.queryByText(/Test User/)).not.toBeInTheDocument();
  });

  it('should handle different task types correctly', () => {
    const { rerender } = renderTaskCard({ type: 'feature' });
    expect(screen.getByText('✨')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <TaskCard task={createMockTask({ type: 'epic' })} />
      </BrowserRouter>
    );
    expect(screen.getByText('🎯')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <TaskCard task={createMockTask({ type: 'task' })} />
      </BrowserRouter>
    );
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('should handle different priority levels', () => {
    const priorities = [
      { priority: 'low', expectedClass: 'bg-gray-100' },
      { priority: 'medium', expectedClass: 'bg-yellow-100' },
      { priority: 'high', expectedClass: 'bg-orange-100' },
      { priority: 'critical', expectedClass: 'bg-red-100' },
    ];

    priorities.forEach(({ priority, expectedClass }) => {
      const { rerender } = renderTaskCard({ priority });
      const priorityElement = screen.getByText(priority);
      expect(priorityElement).toHaveClass(expectedClass);
      
      rerender(<div />);
    });
  });
});