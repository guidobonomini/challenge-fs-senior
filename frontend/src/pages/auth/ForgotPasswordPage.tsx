import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  return (
    <form className="mt-8 space-y-6">
      <div>
        <h2 className="text-center text-2xl font-extrabold text-gray-900 dark:text-white">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input-base"
          placeholder="Email address"
        />
      </div>

      <div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Send reset link
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

export default ForgotPasswordPage;