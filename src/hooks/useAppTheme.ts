import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { lightTheme } from '@/constants/theme';

/**
 * A defensive wrapper around useTheme that prevents the "Cannot read property 'bold' of undefined" error
 * This hook ensures that theme is always available, even during initialization
 */
export function useAppTheme() {
  try {
    // Try to get the theme from context
    const context = useContext(ThemeContext);
    
    if (context && context.theme) {
      return context;
    }
    
    // Fallback to default theme if context is not ready
    return {
      theme: lightTheme,
      themeMode: 'light' as const,
      isDark: false,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  } catch (error) {
    // If any error occurs, return default theme
    console.warn('useAppTheme: Error accessing theme context, using default', error);
    return {
      theme: lightTheme,
      themeMode: 'light' as const,
      isDark: false,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
}