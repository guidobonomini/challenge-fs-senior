import React from 'react';
import { Link } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  return (
    <form className="mt-8 space-y-6">
      <div>
        <h2 className="text-center text-2xl font-extrabold text-gray-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="sr-only">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input-base"
            placeholder="New password"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="input-base"
            placeholder="Confirm password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Reset password
        </button>
      </div>

      <div className="text-center">
        <Link
          to="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
};

export default ResetPasswordPage;