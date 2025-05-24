import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import * as Icon from 'react-native-feather';
import Card from '@/components/ui/Card';
import { UserProfile, WeightEntry, MetricsStats } from '@/types/metrics';
import { format } from 'date-fns';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    heightUnit: 'cm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [metricsStats, setMetricsStats] = useState<MetricsStats>({});
  const [refreshing, setRefreshing] = useState(false);

  const navigateToMetrics = (type: 'weight' | 'measurements' | 'photos') => {
    navigation.navigate('MetricsDetail', { type });
  };

  const formatWeight = (weight: number, unit: string = 'lbs') => {
    return `${weight.toFixed(1)} ${unit}`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
            <Icon.User color={theme.colors.gray[400]} width={40} height={40} />
          </View>
        </View>
        
        <Text style={styles.profileName}>{profile?.name || 'Add your name'}</Text>
        <Text style={styles.profileEmail}>{profile?.email || 'Add your email'}</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon.Edit2 color="white" width={16} height={16} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Icon.TrendingDown color={theme.colors.primary} width={24} height={24} />
            <Text style={styles.statValue}>
              {metricsStats.currentWeight ? formatWeight(metricsStats.currentWeight) : '--'}
            </Text>
            <Text style={styles.statLabel}>Current</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Icon.Target color={theme.colors.success} width={24} height={24} />
            <Text style={styles.statValue}>
              {metricsStats.totalWeightChange 
                ? `${metricsStats.totalWeightChange > 0 ? '+' : ''}${formatWeight(Math.abs(metricsStats.totalWeightChange))}`
                : '--'}
            </Text>
            <Text style={styles.statLabel}>Total Change</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Icon.Activity color={theme.colors.warning} width={24} height={24} />
            <Text style={styles.statValue}>
              {metricsStats.weeklyAverage 
                ? `${formatWeight(Math.abs(metricsStats.weeklyAverage))}/wk`
                : '--'}
            </Text>
            <Text style={styles.statLabel}>Weekly Avg</Text>
          </Card>
        </View>
      </View>

      {/* Metrics Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Track Your Progress</Text>
        
        <TouchableOpacity 
          style={styles.metricItem}
          onPress={() => navigateToMetrics('weight')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.TrendingUp color={theme.colors.primary} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Weight Tracking</Text>
            <Text style={styles.metricDescription}>
              {weightEntries.length > 0 
                ? `${weightEntries.length} entries • Last: ${format(new Date(weightEntries[0].date), 'MMM d')}`
                : 'Start tracking your weight'}
            </Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.metricItem}
          onPress={() => navigateToMetrics('measurements')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.Maximize color={theme.colors.secondary} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Body Measurements</Text>
            <Text style={styles.metricDescription}>Track chest, waist, arms, and more</Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.metricItem}
          onPress={() => navigateToMetrics('photos')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.Camera color={theme.colors.accent} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Progress Photos</Text>
            <Text style={styles.metricDescription}>Visualize your transformation</Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  profileImageContainer: {
    marginBottom: theme.spacing.md,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  editButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[600],
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  metricDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
});