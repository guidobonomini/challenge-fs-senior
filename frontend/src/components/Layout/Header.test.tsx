import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from './Header';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';

// Mock the stores
jest.mock('../../store/authStore');
jest.mock('../../store/sidebarStore');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Header Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'member' as const,
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    email_verified: true,
  };

  beforeEach(() => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });
    (useSidebarStore as unknown as jest.Mock).mockReturnValue({
      isCollapsed: false,
      toggle: jest.fn(),
    });
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  it('renders user information correctly', () => {
    renderHeader();
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays sidebar toggle button', () => {
    renderHeader();
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls sidebar toggle when button is clicked', () => {
    const mockToggle = jest.fn();
    (useSidebarStore as unknown as jest.Mock).mockReturnValue({
      isCollapsed: false,
      toggle: mockToggle,
    });

    renderHeader();
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows user dropdown menu when clicked', () => {
    renderHeader();
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('calls logout when sign out is clicked', () => {
    const mockLogout = jest.fn();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });

    renderHeader();
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders without user when not logged in', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    renderHeader();
    
    // Should still render the header but without user info
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});