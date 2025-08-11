import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ValidationResult } from '../../utils/validation';

interface ValidatedTextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  validation?: (value: string) => ValidationResult;
  sanitization?: (value: string) => string;
  onChange: (value: string, isValid: boolean) => void;
  showValidation?: boolean;
  helpText?: string;
  required?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

const ValidatedTextArea: React.FC<ValidatedTextAreaProps> = ({
  label,
  validation,
  sanitization,
  onChange,
  showValidation = true,
  helpText,
  required = false,
  maxLength,
  showCharacterCount = true,
  className = '',
  rows = 3,
  ...textareaProps
}) => {
  const [value, setValue] = useState(textareaProps.value as string || '');
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (textareaProps.value !== undefined) {
      setValue(textareaProps.value as string);
    }
  }, [textareaProps.value]);

  const validateInput = (inputValue: string): ValidationResult => {
    if (required && !inputValue.trim()) {
      return { isValid: false, errors: [`${label} is required`] };
    }
    
    if (validation) {
      return validation(inputValue);
    }
    
    return { isValid: true, errors: [] };
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    // Apply max length limit
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    
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

  const textareaClasses = `
    input-base resize-none
    ${shouldShowErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${shouldShowSuccess ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}
    ${className}
  `;

  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isAtLimit = maxLength && characterCount >= maxLength;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <span className={`text-xs ${
            isAtLimit ? 'text-red-500' : 
            isNearLimit ? 'text-yellow-500' : 
            'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount}/{maxLength}
          </span>
        )}
      </div>
      
      <div className="relative">
        <textarea
          {...textareaProps}
          rows={rows}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={textareaClasses}
          aria-invalid={!validationResult.isValid}
          aria-describedby={`${textareaProps.id || label}-help ${textareaProps.id || label}-error`}
        />
        
        {/* Validation Icons */}
        {showValidation && (
          <div className="absolute top-3 right-3">
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
          id={`${textareaProps.id || label}-help`}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}
      
      {/* Error Messages */}
      {shouldShowErrors && (
        <div
          id={`${textareaProps.id || label}-error`}
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

export default ValidatedTextArea;