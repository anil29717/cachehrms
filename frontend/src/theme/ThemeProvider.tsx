import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useThemeStore } from '../stores/themeStore';

const ThemeContext = createContext<{ theme: 'light' | 'dark'; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, toggle } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
