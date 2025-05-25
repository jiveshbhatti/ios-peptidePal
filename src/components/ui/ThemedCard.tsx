import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Theme } from '@/constants/theme';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ThemedCard({ children, style }: ThemedCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.isDark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: theme.isDark ? 8 : 4,
  },
});