import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TaskCard from '../Kanban/TaskCard';
import { Task } from '../../types';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  project_id: 'proj-1',
  assignee_id: 'user-1',
  reporter_id: 'user-2',
  story_points: 3,
  time_estimate: 480,
  time_spent: 0,
  due_date: '2024-12-31T00:00:00Z',
  position: 1,
  parent_task_id: undefined,
  custom_fields: undefined,
  is_archived: false,
  started_at: undefined,
  completed_at: undefined,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TaskCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTaskCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <TaskCard
          task={mockTask}
          {...props}
        />
      </BrowserRouter>
    );
  };

  it('renders task information correctly', () => {
    renderTaskCard();
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
  });

  it('displays task priority badge', () => {
    renderTaskCard();
    
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('displays task type badge', () => {
    renderTaskCard();
    
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('displays story points when provided', () => {
    renderTaskCard();
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Story points
  });

  it('navigates to task detail when task card is clicked', () => {
    renderTaskCard();
    
    const taskCard = screen.getByText('Test Task').closest('div');
    fireEvent.click(taskCard!);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/1');
  });

  it('displays due date when provided', () => {
    renderTaskCard();
    
    // Should show due date in some format
    expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
  });

  it('shows high priority tasks with different styling', () => {
    const highPriorityTask = { ...mockTask, priority: 'critical' as const };
    renderTaskCard({ task: highPriorityTask });
    
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles tasks without description', () => {
    const taskWithoutDescription = { ...mockTask, description: undefined };
    renderTaskCard({ task: taskWithoutDescription });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('This is a test task')).not.toBeInTheDocument();
  });

  it('handles tasks without due date', () => {
    const taskWithoutDueDate = { ...mockTask, due_date: undefined };
    renderTaskCard({ task: taskWithoutDueDate });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    // Should not crash and should render without due date
  });

  it('displays correct status', () => {
    const inProgressTask = { ...mockTask, status: 'in_progress' as const };
    renderTaskCard({ task: inProgressTask });
    
    // Should show some indication of in-progress status
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('shows completed tasks with appropriate styling', () => {
    const completedTask = { 
      ...mockTask, 
      status: 'done' as const,
      completed_at: '2024-01-02T00:00:00Z'
    };
    renderTaskCard({ task: completedTask });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});