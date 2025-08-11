import React from 'react';
import { render, screen } from '@testing-library/react';
import ViewerIndicator from './ViewerIndicator';

describe('ViewerIndicator', () => {
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
      avatar_url: 'https://example.com/avatar.jpg',
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
      <ViewerIndicator viewers={[]} currentUserId={currentUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when only current user is viewing', () => {
    const viewers = [{ ...mockUsers[0], id: currentUserId }];
    const { container } = render(
      <ViewerIndicator viewers={viewers} currentUserId={currentUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render single viewer correctly', () => {
    render(
      <ViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('John Doe is viewing')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
    expect(screen.getByTitle('John Doe')).toBeInTheDocument();
  });

  it('should render multiple viewers correctly', () => {
    render(
      <ViewerIndicator viewers={mockUsers} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('3 people viewing')).toBeInTheDocument();
    
    // Should show user avatars/initials
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe (no avatar, shows initials)
    expect(screen.getByAltText('Jane Smith')).toBeInTheDocument(); // Jane Smith (has avatar)
    expect(screen.getByText('BJ')).toBeInTheDocument(); // Bob Johnson (no avatar, shows initials)
  });

  it('should show avatar image when available', () => {
    render(
      <ViewerIndicator viewers={[mockUsers[1]]} currentUserId={currentUserId} />
    );
    
    const avatar = screen.getByAltText('Jane Smith');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show initials when no avatar', () => {
    render(
      <ViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should limit displayed viewers and show overflow count', () => {
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
      <ViewerIndicator 
        viewers={manyViewers} 
        currentUserId={currentUserId} 
        maxDisplayed={3} 
      />
    );
    
    expect(screen.getByText('5 people viewing')).toBeInTheDocument();
    
    // Should show overflow indicator
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByTitle('+2 more viewers')).toBeInTheDocument();
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
      <ViewerIndicator 
        viewers={viewersWithCurrentUser} 
        currentUserId={currentUserId} 
      />
    );
    
    // Should only show 3 other viewers, not including current user
    expect(screen.getByText('3 people viewing')).toBeInTheDocument();
    expect(screen.queryByText('Current User')).not.toBeInTheDocument();
  });

  it('should handle custom maxDisplayed prop', () => {
    render(
      <ViewerIndicator 
        viewers={mockUsers} 
        currentUserId={currentUserId} 
        maxDisplayed={2} 
      />
    );
    
    expect(screen.getByText('3 people viewing')).toBeInTheDocument();
    
    // Should show overflow for 2 displayed + 1 remaining
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should show animated pulse indicator', () => {
    render(
      <ViewerIndicator viewers={[mockUsers[0]]} currentUserId={currentUserId} />
    );
    
    const pulseIndicator = screen.getByText('John Doe is viewing').previousSibling;
    expect(pulseIndicator).toHaveClass('animate-pulse');
    expect(pulseIndicator).toHaveClass('bg-green-500');
  });
});