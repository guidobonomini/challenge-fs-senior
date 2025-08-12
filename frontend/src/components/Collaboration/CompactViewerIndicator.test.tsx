import React from 'react';
import { render, screen } from '@testing-library/react';
import CompactViewerIndicator from './CompactViewerIndicator';

describe('CompactViewerIndicator', () => {
  const mockUsers = [
    {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      avatar_url: null,
    },
    {
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      avatar_url: null,
    },
    {
      id: 'user-3',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
      avatar_url: null,
    },
  ];

  const currentUserId = 'current-user';

  it('should not render when no other viewers', () => {
    const { container } = render(
      <CompactViewerIndicator viewers={[]} currentUserId={currentUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when only current user is viewing', () => {
    const viewers = [{ ...mockUsers[0], id: currentUserId }];
    const { container } = render(
      <CompactViewerIndicator viewers={viewers} currentUserId={currentUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render single viewer correctly', () => {
    render(
      <CompactViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Check tooltip
    const indicator = screen.getByTitle('John Doe is viewing');
    expect(indicator).toBeInTheDocument();
  });

  it('should render multiple viewers correctly', () => {
    render(
      <CompactViewerIndicator viewers={mockUsers} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check tooltip for multiple viewers
    const indicator = screen.getByTitle('John Doe, Jane Smith, Bob Johnson are viewing');
    expect(indicator).toBeInTheDocument();
  });

  it('should show eye icon and pulse indicator', () => {
    render(
      <CompactViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    // Check for eye icon (by looking for svg element)
    const eyeIcon = document.querySelector('svg');
    expect(eyeIcon).toBeInTheDocument();
    
    // Check for pulse animation
    const pulseElement = document.querySelector('.animate-pulse');
    expect(pulseElement).toBeInTheDocument();
    expect(pulseElement).toHaveClass('bg-green-500');
  });

  it('should filter out current user from viewers', () => {
    const viewersWithCurrentUser = [
      ...mockUsers,
      {
        id: currentUserId,
        first_name: 'Current',
        last_name: 'User',
        email: 'current@example.com',
        avatar_url: null,
      },
    ];

    render(
      <CompactViewerIndicator 
        viewers={viewersWithCurrentUser} 
        currentUserId={currentUserId} 
      />
    );
    
    // Should only show count for 3 other viewers
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should truncate tooltip for many viewers', () => {
    const manyViewers = [
      ...mockUsers,
      {
        id: 'user-4',
        first_name: 'Alice',
        last_name: 'Brown',
        email: 'alice@example.com',
        avatar_url: null,
      },
      {
        id: 'user-5',
        first_name: 'Charlie',
        last_name: 'Wilson',
        email: 'charlie@example.com',
        avatar_url: null,
      },
    ];

    render(
      <CompactViewerIndicator 
        viewers={manyViewers} 
        currentUserId={currentUserId} 
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Should show truncated tooltip
    const indicator = screen.getByTitle('John Doe, Jane Smith, Bob Johnson and 2 more are viewing');
    expect(indicator).toBeInTheDocument();
  });

  it('should handle exactly 3 viewers without truncation', () => {
    render(
      <CompactViewerIndicator viewers={mockUsers} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Should not show "and X more" for exactly 3 viewers
    const indicator = screen.getByTitle('John Doe, Jane Smith, Bob Johnson are viewing');
    expect(indicator).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    const { container } = render(
      <CompactViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-1', 'text-green-600');
  });
});