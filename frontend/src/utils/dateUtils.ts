import { formatDistanceToNow } from 'date-fns';

/**
 * Safely formats a date string to relative time (e.g., "2 hours ago")
 * @param dateString - The date string to format
 * @param options - Options for formatDistanceToNow
 * @returns Formatted relative time string or fallback text
 */
export const formatDateSafely = (
  dateString: string | null | undefined, 
  options: { addSuffix?: boolean } = { addSuffix: true },
  fallback: string = 'Date not available'
): string => {
  if (!dateString || isNaN(Date.parse(dateString))) {
    return fallback;
  }
  
  try {
    return formatDistanceToNow(new Date(dateString), options);
  } catch (error) {
    console.warn('Failed to format date:', dateString, error);
    return fallback;
  }
};

/**
 * Checks if a date string is valid
 * @param dateString - The date string to validate
 * @returns true if the date string is valid
 */
export const isValidDateString = (dateString: string | null | undefined): boolean => {
  return !!(dateString && !isNaN(Date.parse(dateString)));
};

/**
 * Safely creates a Date object from a string
 * @param dateString - The date string to convert
 * @returns Date object or null if invalid
 */
export const createDateSafely = (dateString: string | null | undefined): Date | null => {
  if (!isValidDateString(dateString)) {
    return null;
  }
  return new Date(dateString!);
};