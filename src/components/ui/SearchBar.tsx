import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onFocus,
  onBlur,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Icon.Search
        width={20}
        height={20}
        color={theme.colors.gray[400]}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray[400]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 36,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
  },
});