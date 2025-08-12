import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  test('should render with default properties', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('should render with small size', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  test('should render with medium size (default)', () => {
    render(<LoadingSpinner size="md" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6', 'w-6');
  });

  test('should render with large size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  test('should render with extra large size', () => {
    render(<LoadingSpinner size="xl" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  test('should render with primary color (default)', () => {
    render(<LoadingSpinner color="primary" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-primary-600');
  });

  test('should render with white color', () => {
    render(<LoadingSpinner color="white" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-white');
  });

  test('should render with gray color', () => {
    render(<LoadingSpinner color="gray" />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-gray-600');
  });

  test('should be accessible with screen readers', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('should render with custom className', () => {
    const customClass = 'my-custom-class';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(customClass);
  });

  test('should render with all props combined', () => {
    const customClass = 'custom-spinner';
    render(
      <LoadingSpinner 
        size="lg" 
        color="white" 
        className={customClass}
      />
    );
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8', 'border-white', customClass);
  });

  test('should have spinner animation class', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('animate-spin');
  });

  test('should have base spinner classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass(
      'spinner',
      'border-2', 
      'border-gray-200', 
      'rounded-full', 
      'animate-spin'
    );
  });

  test('should handle undefined props gracefully', () => {
    // Test with explicitly undefined props
    render(<LoadingSpinner size={undefined} color={undefined} className={undefined} />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    // Should use defaults
    expect(spinner).toHaveClass('h-6', 'w-6', 'border-primary-600');
  });

  test('should render as div element', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByLabelText('Loading');
    expect(spinner.tagName).toBe('DIV');
  });
});