import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  FlatListProps,
} from 'react-native';
import { theme } from '@/constants/theme';

interface ListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  ItemSeparatorComponent?: React.ComponentType<any>;
}

export default function List<T>({
  data,
  renderItem,
  loading = false,
  refreshing = false,
  onRefresh,
  emptyMessage = 'No items found',
  ItemSeparatorComponent,
  ...props
}: ListProps<T>) {
  if (loading && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={(_, index) => index.toString()}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      ItemSeparatorComponent={
        ItemSeparatorComponent || (() => <View style={styles.separator} />)
      }
      contentContainerStyle={data.length === 0 ? styles.emptyContent : undefined}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.gray[100],
  },
  emptyContent: {
    flexGrow: 1,
  },
});