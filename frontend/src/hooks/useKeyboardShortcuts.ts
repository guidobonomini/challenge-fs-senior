import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  callback: (event: KeyboardEvent) => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enableGlobal?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enableGlobal = true }: UseKeyboardShortcutsOptions) => {
  const activeShortcutsRef = useRef<KeyboardShortcut[]>([]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.contentEditable === 'true';

    if (isTyping && !event.ctrlKey && !event.metaKey) {
      return;
    }

    for (const shortcut of activeShortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      // Handle Ctrl/Meta key matching properly
      const matchesCtrl = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const matchesMeta = shortcut.meta ? event.metaKey : true; // Meta is optional
      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.callback(event);
        break;
      }
    }
  }, []);

  useEffect(() => {
    activeShortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enableGlobal) return;

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, enableGlobal]);

  return { handleKeyPress };
};

// Predefined shortcut configurations
export const createTaskShortcuts = (callbacks: {
  createTask?: () => void;
  searchTasks?: () => void;
  toggleView?: () => void;
  focusSearch?: () => void;
  showHelp?: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'n',
    ctrl: true,
    callback: callbacks.createTask || (() => {}),
    description: 'Create new task',
    enabled: !!callbacks.createTask,
  },
  {
    key: 'k',
    ctrl: true,
    callback: callbacks.searchTasks || (() => {}),
    description: 'Search tasks',
    enabled: !!callbacks.searchTasks,
  },
  {
    key: 'v',
    ctrl: true,
    callback: callbacks.toggleView || (() => {}),
    description: 'Toggle view mode',
    enabled: !!callbacks.toggleView,
  },
  {
    key: '/',
    callback: callbacks.focusSearch || (() => {}),
    description: 'Focus search',
    enabled: !!callbacks.focusSearch,
  },
  {
    key: '?',
    shift: true,
    callback: callbacks.showHelp || (() => {}),
    description: 'Show keyboard shortcuts',
    enabled: !!callbacks.showHelp,
  },
];

export const createNavigationShortcuts = (callbacks: {
  goToDashboard?: () => void;
  goToProjects?: () => void;
  goToTasks?: () => void;
  goToTeams?: () => void;
}): KeyboardShortcut[] => [
  {
    key: '1',
    alt: true,
    callback: callbacks.goToDashboard || (() => {}),
    description: 'Go to Dashboard',
    enabled: !!callbacks.goToDashboard,
  },
  {
    key: '2',
    alt: true,
    callback: callbacks.goToProjects || (() => {}),
    description: 'Go to Projects',
    enabled: !!callbacks.goToProjects,
  },
  {
    key: '3',
    alt: true,
    callback: callbacks.goToTasks || (() => {}),
    description: 'Go to Tasks',
    enabled: !!callbacks.goToTasks,
  },
  {
    key: '4',
    alt: true,
    callback: callbacks.goToTeams || (() => {}),
    description: 'Go to Teams',
    enabled: !!callbacks.goToTeams,
  },
];