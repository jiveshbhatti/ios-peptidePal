import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Theme } from '@/constants/theme';

/**
 * Hook to create themed styles
 * @param stylesFn Function that takes theme and returns styles
 * @returns Memoized styles object
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  
  return useMemo(() => stylesFn(theme), [theme, stylesFn]);
}

/**
 * Helper to create a themed styles hook for a component
 * @param stylesFn Function that takes theme and returns styles
 * @returns Hook that returns themed styles
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
) {
  return () => useThemedStyles(stylesFn);
}