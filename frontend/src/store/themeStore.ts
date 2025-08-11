import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
  initialize: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,

      toggle: () => {
        const newIsDark = !get().isDark;
        set({ isDark: newIsDark });
        updateDocumentClass(newIsDark);
      },

      setDark: (dark: boolean) => {
        set({ isDark: dark });
        updateDocumentClass(dark);
      },

      initialize: () => {
        const stored = get().isDark;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = stored !== undefined ? stored : prefersDark;
        
        set({ isDark: shouldBeDark });
        updateDocumentClass(shouldBeDark);
      },
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentClass(state.isDark);
        }
      },
    }
  )
);

function updateDocumentClass(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference
    const hasManualPreference = localStorage.getItem('theme-store');
    if (!hasManualPreference) {
      useThemeStore.getState().setDark(e.matches);
    }
  });
}