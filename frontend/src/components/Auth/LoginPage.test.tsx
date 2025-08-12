import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/auth/LoginPage';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      isInitialized: true,
    });
  });

  it('renders login form elements', () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('displays demo accounts information', () => {
    renderLoginPage();

    expect(screen.getByText('Demo Accounts')).toBeInTheDocument();
    expect(screen.getByText(/admin@demo.com/)).toBeInTheDocument();
    expect(screen.getByText(/manager@demo.com/)).toBeInTheDocument();
    expect(screen.getByText(/user@demo.com/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('Email address');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits form with valid credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state during login', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      initialize: jest.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      isInitialized: true,
    });

    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Password toggle button

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('handles login errors', async () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          details: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
        },
      },
    };
    mockLogin.mockRejectedValue(mockError);

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });
  });
});