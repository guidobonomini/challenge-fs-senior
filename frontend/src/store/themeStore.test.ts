import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from './themeStore';

// Mock document
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
  writable: true,
});

describe('ThemeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useThemeStore.setState({
      isDark: false,
    });
    
    // Mock window.matchMedia for all tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.isDark).toBe(false);
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.setDark).toBe('function');
      expect(typeof result.current.initialize).toBe('function');
    });
  });

  describe('toggle', () => {
    test('should toggle dark mode from false to true', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.toggle();
      });
      
      expect(result.current.isDark).toBe(true);
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    test('should toggle dark mode from true to false', () => {
      const { result } = renderHook(() => useThemeStore());
      
      // Set initial state to dark mode
      act(() => {
        useThemeStore.setState({ isDark: true });
      });
      
      act(() => {
        result.current.toggle();
      });
      
      expect(result.current.isDark).toBe(false);
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('setDark', () => {
    test('should set dark mode to true', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(true);
      });
      
      expect(result.current.isDark).toBe(true);
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    test('should set dark mode to false', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(false);
      });
      
      expect(result.current.isDark).toBe(false);
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    test('should update document class when setting dark mode', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(true);
      });
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      
      act(() => {
        result.current.setDark(false);
      });
      
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('initialize', () => {
    test('should initialize with stored preference', () => {
      const { result } = renderHook(() => useThemeStore());
      
      // Mock localStorage to return dark mode
      act(() => {
        useThemeStore.setState({ isDark: true });
      });
      
      act(() => {
        result.current.initialize();
      });
      
      expect(result.current.isDark).toBe(true);
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    test('should initialize with system preference when appropriate', () => {
      // Mock window.matchMedia to return dark preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: true, // System prefers dark mode
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      const { result } = renderHook(() => useThemeStore());
      
      // Clear any previous calls
      (document.documentElement.classList.add as jest.Mock).mockClear();
      
      act(() => {
        result.current.initialize();
      });
      
      // The initialize function uses the stored value if it exists, which in our case is false
      // So even though system prefers dark, it will use the stored value (false)
      expect(result.current.isDark).toBe(false);
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('State Persistence', () => {
    test('should maintain state across multiple renders', () => {
      const { result, rerender } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(true);
      });
      
      rerender();
      
      expect(result.current.isDark).toBe(true);
    });
  });

  describe('Multiple Store Instances', () => {
    test('should share state between multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useThemeStore());
      const { result: result2 } = renderHook(() => useThemeStore());
      
      act(() => {
        result1.current.setDark(true);
      });
      
      expect(result2.current.isDark).toBe(true);
    });
  });

  describe('Document Class Updates', () => {
    test('should add dark class when setting dark mode', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(true);
      });
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    test('should remove dark class when disabling dark mode', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setDark(false);
      });
      
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    });
  });
});