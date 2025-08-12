import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { RegisterData } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterData & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 400) {
        const details = error.response.data?.details;
        if (details) {
          details.forEach((detail: any) => {
            setError(detail.field as keyof RegisterData, {
              message: detail.message,
            });
          });
        }
      }
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="first_name" className="sr-only">
              First Name
            </label>
            <input
              {...register('first_name', {
                required: 'First name is required',
                minLength: {
                  value: 1,
                  message: 'First name must be at least 1 character',
                },
                maxLength: {
                  value: 50,
                  message: 'First name must not exceed 50 characters',
                },
              })}
              type="text"
              autoComplete="given-name"
              className={`input-base ${
                errors.first_name ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
              }`}
              placeholder="First name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="last_name" className="sr-only">
              Last Name
            </label>
            <input
              {...register('last_name', {
                required: 'Last name is required',
                minLength: {
                  value: 1,
                  message: 'Last name must be at least 1 character',
                },
                maxLength: {
                  value: 50,
                  message: 'Last name must not exceed 50 characters',
                },
              })}
              type="text"
              autoComplete="family-name"
              className={`input-base ${
                errors.last_name ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
              }`}
              placeholder="Last name"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

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
            className={`input-base ${
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
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`input-base pr-10 ${
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

        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`input-base ${
              errors.confirmPassword ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
            }`}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.confirmPassword.message}
            </p>
          )}
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
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </div>

      <div className="text-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign in
          </Link>
        </span>
      </div>
    </form>
  );
};

export default RegisterPage;