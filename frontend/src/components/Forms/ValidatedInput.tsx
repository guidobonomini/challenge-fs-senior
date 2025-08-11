import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { validate, sanitize, ValidationResult } from '../../utils/validation';

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  validation?: (value: string) => ValidationResult;
  sanitization?: (value: string) => string;
  onChange: (value: string, isValid: boolean) => void;
  showValidation?: boolean;
  helpText?: string;
  required?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  validation,
  sanitization,
  onChange,
  showValidation = true,
  helpText,
  required = false,
  className = '',
  type = 'text',
  ...inputProps
}) => {
  const [value, setValue] = useState(inputProps.value as string || '');
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (inputProps.value !== undefined) {
      setValue(inputProps.value as string);
    }
  }, [inputProps.value]);

  const validateInput = (inputValue: string): ValidationResult => {
    if (required && !inputValue.trim()) {
      return { isValid: false, errors: [`${label} is required`] };
    }
    
    if (validation) {
      return validation(inputValue);
    }
    
    return { isValid: true, errors: [] };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Apply sanitization if provided
    if (sanitization) {
      newValue = sanitization(newValue);
    }
    
    setValue(newValue);
    
    // Validate the input
    const result = validateInput(newValue);
    setValidationResult(result);
    
    // Call parent onChange with sanitized value and validation status
    onChange(newValue, result.isValid);
  };

  const handleBlur = () => {
    setIsTouched(true);
    setIsFocused(false);
    
    // Re-validate on blur
    const result = validateInput(value);
    setValidationResult(result);
    onChange(value, result.isValid);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const shouldShowErrors = showValidation && isTouched && !isFocused && !validationResult.isValid;
  const shouldShowSuccess = showValidation && isTouched && validationResult.isValid && value.length > 0;

  const inputClasses = `
    input-base
    ${shouldShowErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${shouldShowSuccess ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          {...inputProps}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={inputClasses}
          aria-invalid={!validationResult.isValid}
          aria-describedby={`${inputProps.id || label}-help ${inputProps.id || label}-error`}
        />
        
        {/* Validation Icons */}
        {showValidation && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {shouldShowErrors && (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
            {shouldShowSuccess && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {helpText && (
        <p
          id={`${inputProps.id || label}-help`}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}
      
      {/* Error Messages */}
      {shouldShowErrors && (
        <div
          id={`${inputProps.id || label}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {validationResult.errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      
      {/* Success Message */}
      {shouldShowSuccess && (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Valid {label.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;