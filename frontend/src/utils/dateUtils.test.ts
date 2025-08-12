import { formatDistanceToNow } from 'date-fns';
import * as dateUtils from './dateUtils';

// Mock date-fns to ensure consistent test results
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(),
}));

const mockedFormatDistanceToNow = formatDistanceToNow as jest.MockedFunction<typeof formatDistanceToNow>;

describe('Date Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatDateSafely', () => {
    test('should format valid date string using formatDistanceToNow', () => {
      const testDate = '2023-06-15T10:30:00Z';
      const expectedOutput = '2 hours ago';
      
      mockedFormatDistanceToNow.mockReturnValue(expectedOutput);

      const result = dateUtils.formatDateSafely(testDate);

      expect(mockedFormatDistanceToNow).toHaveBeenCalledWith(
        new Date(testDate), 
        { addSuffix: true }
      );
      expect(result).toBe(expectedOutput);
    });

    test('should return fallback for null date', () => {
      const result = dateUtils.formatDateSafely(null);
      expect(result).toBe('Date not available');
      expect(mockedFormatDistanceToNow).not.toHaveBeenCalled();
    });

    test('should return fallback for undefined date', () => {
      const result = dateUtils.formatDateSafely(undefined);
      expect(result).toBe('Date not available');
      expect(mockedFormatDistanceToNow).not.toHaveBeenCalled();
    });

    test('should return fallback for invalid date string', () => {
      const result = dateUtils.formatDateSafely('invalid-date');
      expect(result).toBe('Date not available');
      expect(mockedFormatDistanceToNow).not.toHaveBeenCalled();
    });

    test('should return custom fallback', () => {
      const customFallback = 'No date';
      const result = dateUtils.formatDateSafely(null, { addSuffix: true }, customFallback);
      expect(result).toBe(customFallback);
    });

    test('should use custom options', () => {
      const testDate = '2023-06-15T10:30:00Z';
      const expectedOutput = '2 hours';
      const customOptions = { addSuffix: false };
      
      mockedFormatDistanceToNow.mockReturnValue(expectedOutput);

      const result = dateUtils.formatDateSafely(testDate, customOptions);

      expect(mockedFormatDistanceToNow).toHaveBeenCalledWith(
        new Date(testDate), 
        customOptions
      );
      expect(result).toBe(expectedOutput);
    });

    test('should handle formatDistanceToNow errors gracefully', () => {
      const testDate = '2023-06-15T10:30:00Z';
      
      mockedFormatDistanceToNow.mockImplementation(() => {
        throw new Error('Format error');
      });

      // Spy on console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = dateUtils.formatDateSafely(testDate);

      expect(result).toBe('Date not available');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to format date:', 
        testDate, 
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isValidDateString', () => {
    test('should return true for valid date strings', () => {
      const validDates = [
        '2023-06-15T10:30:00Z',
        '2023-06-15',
        'June 15, 2023',
        '06/15/2023'
      ];

      validDates.forEach(date => {
        expect(dateUtils.isValidDateString(date)).toBe(true);
      });
    });

    test('should return false for invalid date strings', () => {
      const invalidDates = [
        null,
        undefined,
        '',
        'invalid-date',
        'not a date at all',
        '2023-13-45', // Invalid month/day
      ];

      invalidDates.forEach(date => {
        expect(dateUtils.isValidDateString(date)).toBe(false);
      });
    });
  });

  describe('createDateSafely', () => {
    test('should return Date object for valid date strings', () => {
      const validDate = '2023-06-15T10:30:00Z';
      const result = dateUtils.createDateSafely(validDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date(validDate).getTime());
    });

    test('should return null for invalid date strings', () => {
      const invalidDates = [
        null,
        undefined,
        '',
        'invalid-date',
        'not a date at all'
      ];

      invalidDates.forEach(date => {
        expect(dateUtils.createDateSafely(date)).toBeNull();
      });
    });

    test('should return null for undefined', () => {
      expect(dateUtils.createDateSafely(undefined)).toBeNull();
    });

    test('should return null for null', () => {
      expect(dateUtils.createDateSafely(null)).toBeNull();
    });
  });
});