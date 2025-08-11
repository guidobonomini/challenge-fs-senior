import DOMPurify from 'dompurify';

// Validation rules
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  name: {
    pattern: /^[a-zA-Z\s'-]{2,50}$/,
    message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes',
  },
  title: {
    minLength: 3,
    maxLength: 200,
    message: 'Title must be between 3 and 200 characters',
  },
  description: {
    maxLength: 2000,
    message: 'Description must be less than 2000 characters',
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
  },
  url: {
    pattern: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
    message: 'Please enter a valid URL',
  },
};

// Input sanitization functions
export const sanitize = {
  text: (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  },
  
  html: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  },
  
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },
  
  name: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },
  
  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, '');
  },
  
  numeric: (input: string): string => {
    return input.replace(/[^0-9]/g, '');
  },
  
  slug: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

// Validation functions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validate = {
  email: (value: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitize.email(value);
    
    if (!sanitized) {
      errors.push('Email is required');
    } else if (!ValidationRules.email.pattern.test(sanitized)) {
      errors.push(ValidationRules.email.message);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  password: (value: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!value) {
      errors.push('Password is required');
    } else {
      if (value.length < ValidationRules.password.minLength) {
        errors.push(`Password must be at least ${ValidationRules.password.minLength} characters long`);
      }
      if (!ValidationRules.password.pattern.test(value)) {
        errors.push(ValidationRules.password.message);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  name: (value: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitize.name(value);
    
    if (!sanitized) {
      errors.push('Name is required');
    } else if (!ValidationRules.name.pattern.test(sanitized)) {
      errors.push(ValidationRules.name.message);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  title: (value: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitize.text(value);
    
    if (!sanitized) {
      errors.push('Title is required');
    } else {
      if (sanitized.length < ValidationRules.title.minLength) {
        errors.push(`Title must be at least ${ValidationRules.title.minLength} characters long`);
      }
      if (sanitized.length > ValidationRules.title.maxLength) {
        errors.push(`Title must be less than ${ValidationRules.title.maxLength} characters long`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  description: (value: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitize.text(value);
    
    if (sanitized && sanitized.length > ValidationRules.description.maxLength) {
      errors.push(ValidationRules.description.message);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  required: (value: any, fieldName: string = 'Field'): ValidationResult => {
    const errors: string[] = [];
    
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`${fieldName} is required`);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  minLength: (value: string, minLength: number, fieldName: string = 'Field'): ValidationResult => {
    const errors: string[] = [];
    
    if (value && value.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  maxLength: (value: string, maxLength: number, fieldName: string = 'Field'): ValidationResult => {
    const errors: string[] = [];
    
    if (value && value.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters long`);
    }
    
    return { isValid: errors.length === 0, errors };
  },
  
  pattern: (value: string, pattern: RegExp, message: string): ValidationResult => {
    const errors: string[] = [];
    
    if (value && !pattern.test(value)) {
      errors.push(message);
    }
    
    return { isValid: errors.length === 0, errors };
  },
};

// Form validation utility
export interface FormValidationRule {
  field: string;
  validators: ((value: any) => ValidationResult)[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export const validateForm = (data: Record<string, any>, rules: FormValidationRule[]): FormValidationResult => {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  
  rules.forEach(rule => {
    const fieldValue = data[rule.field];
    const fieldErrors: string[] = [];
    
    rule.validators.forEach(validator => {
      const result = validator(fieldValue);
      if (!result.isValid) {
        fieldErrors.push(...result.errors);
      }
    });
    
    if (fieldErrors.length > 0) {
      errors[rule.field] = fieldErrors;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// XSS prevention utilities
export const preventXSS = {
  // Sanitize user input before storing
  sanitizeInput: (input: string, type: 'text' | 'html' = 'text'): string => {
    return type === 'html' ? sanitize.html(input) : sanitize.text(input);
  },
  
  // Escape HTML entities
  escapeHtml: (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },
  
  // Validate and sanitize URLs
  sanitizeUrl: (url: string): string => {
    try {
      const parsed = new URL(url);
      // Only allow http, https, and mailto protocols
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return parsed.toString();
      }
    } catch {
      // Invalid URL
    }
    return '';
  },
};

// Rate limiting for client-side validation
export class ClientRateLimit {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier);
    
    if (!attempts) {
      return false;
    }
    
    // Reset if window has passed
    if (now - attempts.lastAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return attempts.count >= this.maxAttempts;
  }
  
  recordAttempt(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // Reset if window has passed
    if (now - attempts.lastAttempt > this.windowMs) {
      attempts.count = 0;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    this.attempts.set(identifier, attempts);
    
    return attempts.count <= this.maxAttempts;
  }
  
  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier);
    if (!attempts || attempts.count < this.maxAttempts) {
      return 0;
    }
    
    const elapsed = Date.now() - attempts.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}