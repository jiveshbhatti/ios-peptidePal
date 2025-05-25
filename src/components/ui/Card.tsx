import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
  variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({ 
  children, 
  style, 
  padding = 'md',
  variant = 'default' 
}: CardProps) {
  return (
    <View style={[
      styles.base,
      styles[variant],
      { padding: theme.spacing[padding] },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  default: {
    backgroundColor: theme.colors.surface,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.background,
  },
  elevated: {
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
});