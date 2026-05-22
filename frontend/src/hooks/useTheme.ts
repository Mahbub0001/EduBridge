import { useEffect } from 'react';
import { usePreferencesStore } from '../store';

export function useTheme() {
  const { theme, setTheme, toggleTheme } = usePreferencesStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
}
