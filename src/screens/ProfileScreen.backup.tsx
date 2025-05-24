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
import { userProfileService } from '@/services/user-profile.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [metricsStats, setMetricsStats] = useState<MetricsStats>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [weightEntries]);

  const loadData = async () => {
    try {
      // Load profile from Firebase
      const profileData = await userProfileService.getUserProfile();
      setProfile(profileData);

      // Load weight entries from Firebase
      const entries = await userProfileService.getWeightEntries();
      setWeightEntries(entries);
      
      // Check if we need to migrate from AsyncStorage
      const hasLocalData = await AsyncStorage.getItem('@PeptidePal:userProfile');
      if (hasLocalData) {
        Alert.alert(
          'Migrate Data',
          'Found local data. Would you like to migrate it to the cloud?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Migrate',
              onPress: async () => {
                try {
                  await userProfileService.migrateFromAsyncStorage();
                  await loadData(); // Reload after migration
                  Alert.alert('Success', 'Data migrated successfully!');
                } catch (error) {
                  Alert.alert('Error', 'Failed to migrate data');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const calculateStats = () => {
    if (weightEntries.length === 0) return;

    const sortedEntries = [...weightEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const startingWeight = sortedEntries[0].weight;
    const currentWeight = sortedEntries[sortedEntries.length - 1].weight;
    const totalChange = currentWeight - startingWeight;

    // Calculate weekly average
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekEntries = weightEntries.filter(e => new Date(e.date) >= oneWeekAgo);
    const weeklyAverage = weekEntries.length > 1 
      ? (weekEntries[0].weight - weekEntries[weekEntries.length - 1].weight) / weekEntries.length
      : 0;

    setMetricsStats({
      startingWeight,
      currentWeight,
      totalWeightChange: totalChange,
      weeklyAverage,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToMetrics = (type: 'weight' | 'measurements' | 'photos') => {
    navigation.navigate('MetricsDetail', { type });
  };

  const formatWeight = (weight: number, unit: string = 'lbs') => {
    return `${weight.toFixed(1)} ${unit}`;
  };

  const getChangeColor = (change: number) => {
    if (change === 0) return theme.colors.gray[600];
    return change > 0 ? theme.colors.error : theme.colors.success;
  };

  const getChangeIcon = (change: number) => {
    if (change === 0) return null;
    return change > 0 ? 
      <Icon.TrendingUp color={theme.colors.error} width={16} height={16} /> :
      <Icon.TrendingDown color={theme.colors.success} width={16} height={16} />;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
            <Icon.User color={theme.colors.gray[400]} width={40} height={40} />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Icon.Camera color={theme.colors.primary} width={16} height={16} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{profile?.name || 'Add Your Name'}</Text>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon.Edit3 color={theme.colors.primary} width={16} height={16} />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard} variant="elevated">
          <Text style={styles.statValue}>
            {metricsStats.currentWeight ? formatWeight(metricsStats.currentWeight) : '--'}
          </Text>
          <Text style={styles.statLabel}>Current</Text>
        </Card>
        
        <Card style={styles.statCard} variant="elevated">
          <View style={styles.changeContainer}>
            {getChangeIcon(metricsStats.totalWeightChange || 0)}
            <Text style={[
              styles.statValue, 
              { color: getChangeColor(metricsStats.totalWeightChange || 0) }
            ]}>
              {metricsStats.totalWeightChange 
                ? `${metricsStats.totalWeightChange > 0 ? '+' : ''}${metricsStats.totalWeightChange.toFixed(1)}`
                : '--'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Total Change</Text>
        </Card>
        
        <Card style={styles.statCard} variant="elevated">
          <Text style={styles.statValue}>
            {profile?.goals?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Goals</Text>
        </Card>
      </View>

      {/* Metrics Sections */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Track Your Progress</Text>
        
        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => navigateToMetrics('weight')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.TrendingUp color={theme.colors.primary} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Weight Tracking</Text>
            <Text style={styles.metricSubtitle}>
              {weightEntries.length > 0 
                ? `Last entry: ${format(new Date(weightEntries[0].date), 'MMM d')}`
                : 'No entries yet'}
            </Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => navigateToMetrics('measurements')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.Maximize color={theme.colors.secondary} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Body Measurements</Text>
            <Text style={styles.metricSubtitle}>Track circumference changes</Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.metricCard}
          onPress={() => navigateToMetrics('photos')}
        >
          <View style={styles.metricIconContainer}>
            <Icon.Camera color={theme.colors.warning} width={24} height={24} />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>Progress Photos</Text>
            <Text style={styles.metricSubtitle}>Visual transformation tracking</Text>
          </View>
          <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('AddMetric', { type: 'weight' })}
        >
          <Icon.Plus color={theme.colors.primary} width={20} height={20} />
          <Text style={styles.quickActionText}>Log Weight</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('AddMetric', { type: 'measurement' })}
        >
          <Icon.Ruler color={theme.colors.secondary} width={20} height={20} />
          <Text style={styles.quickActionText}>Add Measurements</Text>
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
  },
  editProfileText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metricsSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  metricCard: {
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
    borderRadius: 24,
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
  },
  metricSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  quickActionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
  },
});