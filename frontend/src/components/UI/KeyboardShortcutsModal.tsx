import React from 'react';
import Modal from './Modal';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  enabled?: boolean;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts = []
}) => {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [];
    
    if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.meta) parts.push('⌘');
    if (shortcut.alt) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    if (shortcut.shift) parts.push(navigator.platform.includes('Mac') ? '⇧' : 'Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false);

  // Default shortcuts if none provided
  const defaultShortcuts: KeyboardShortcut[] = [
    { key: 'n', ctrl: true, description: 'Create new task', enabled: true },
    { key: 'k', ctrl: true, description: 'Search tasks', enabled: true },
    { key: 'v', ctrl: true, description: 'Toggle view mode', enabled: true },
    { key: '/', description: 'Focus search', enabled: true },
    { key: '1', alt: true, description: 'Go to Dashboard', enabled: true },
    { key: '2', alt: true, description: 'Go to Projects', enabled: true },
    { key: '3', alt: true, description: 'Go to Tasks', enabled: true },
    { key: '4', alt: true, description: 'Go to Teams', enabled: true },
    { key: '?', shift: true, description: 'Show keyboard shortcuts', enabled: true },
  ];

  const displayShortcuts = enabledShortcuts.length > 0 ? enabledShortcuts : defaultShortcuts;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Use these keyboard shortcuts to navigate and manage your tasks more efficiently.
        </p>

        <div className="space-y-2">
          {displayShortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <span className="text-gray-900 dark:text-white text-sm">
                {shortcut.description}
              </span>
              <div className="flex items-center space-x-1">
                {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && <span className="text-gray-400 text-xs">+</span>}
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono text-gray-700 dark:text-gray-200 shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Note:</strong> Most shortcuts are disabled when typing in input fields to avoid conflicts.
            Use Ctrl/⌘ based shortcuts to override this behavior.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;