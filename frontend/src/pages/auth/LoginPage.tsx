import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { LoginCredentials } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 400) {
        const details = error.response.data?.details;
        if (details) {
          details.forEach((detail: any) => {
            setError(detail.field as keyof LoginCredentials, {
              message: detail.message,
            });
          });
        }
      }
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" name="remember" value="true" />
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            autoComplete="email"
            className={`input-base rounded-t-md rounded-b-none ${
              errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
            }`}
            placeholder="Email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            {...register('password', { required: 'Password is required' })}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`input-base rounded-t-none rounded-b-md pr-10 ${
              errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
            }`}
            placeholder="Password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            to="/auth/forgot-password"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </div>

      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign up
          </Link>
        </span>
      </div>

      {/* Demo accounts info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Demo Accounts
        </h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Admin:</strong> admin@demo.com / password123</p>
          <p><strong>Manager:</strong> manager@demo.com / password123</p>
          <p><strong>Member:</strong> user@demo.com / password123</p>
        </div>
      </div>
    </form>
  );
};

export default LoginPage;