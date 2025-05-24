import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import * as Icon from 'react-native-feather';
import { LineChart } from 'react-native-chart-kit';
import { WeightEntry, BodyMeasurement } from '@/types/metrics';
import { format } from 'date-fns';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { userProfileService } from '@/services/user-profile.service';

const screenWidth = Dimensions.get('window').width;

type MetricsDetailScreenRouteProp = {
  params: {
    type: 'weight' | 'measurements' | 'photos';
  };
};

type MetricsDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MetricsDetail'>;

export default function MetricsDetailScreen() {
  const route = useRoute<MetricsDetailScreenRouteProp>();
  const navigation = useNavigation<MetricsDetailScreenNavigationProp>();
  const { type } = route.params;

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (type === 'photos') {
      // Redirect to dedicated Progress Photos screen
      navigation.replace('ProgressPhotos');
      return;
    }
    
    navigation.setOptions({
      title: type === 'weight' ? 'Weight Tracking' : 'Body Measurements',
    });
    loadData();
  }, [type, navigation]);

  const loadData = async () => {
    try {
      if (type === 'weight') {
        const entries = await userProfileService.getWeightEntries();
        // Sort by date ascending for chart display
        setWeightEntries(entries.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
      } else if (type === 'measurements') {
        const entries = await userProfileService.getBodyMeasurements();
        setMeasurements(entries);
      }
    } catch (error) {
      console.error('Failed to load metrics data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const deleteEntry = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'weight') {
                await userProfileService.deleteWeightEntry(id);
                await loadData(); // Reload data after deletion
              } else if (type === 'measurements') {
                await userProfileService.deleteBodyMeasurement(id);
                await loadData(); // Reload data after deletion
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return weightEntries.filter(entry => new Date(entry.date) >= startDate);
  };

  const renderWeightChart = () => {
    const filteredData = getFilteredData();
    if (filteredData.length < 2) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>
            Add at least 2 entries to see your progress chart
          </Text>
        </View>
      );
    }

    const labels = filteredData.map(entry => format(new Date(entry.date), 'M/d'));
    const data = filteredData.map(entry => entry.weight);

    return (
      <LineChart
        data={{
          labels: labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0),
          datasets: [{
            data,
            strokeWidth: 2,
          }],
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.background,
          backgroundGradientTo: theme.colors.background,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 128, 128, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primary,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    );
  };

  const renderWeightList = () => {
    const sortedEntries = [...weightEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedEntries.map((entry, index) => {
      const previousEntry = sortedEntries[index + 1];
      const change = previousEntry ? entry.weight - previousEntry.weight : 0;

      return (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>
              {format(new Date(entry.date), 'EEEE, MMMM d')}
            </Text>
            <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
              <Icon.Trash2 color={theme.colors.error} width={18} height={18} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.entryContent}>
            <Text style={styles.entryWeight}>
              {entry.weight} {entry.unit}
            </Text>
            {change !== 0 && (
              <View style={styles.changeIndicator}>
                {change > 0 ? (
                  <Icon.TrendingUp color={theme.colors.error} width={16} height={16} />
                ) : (
                  <Icon.TrendingDown color={theme.colors.success} width={16} height={16} />
                )}
                <Text style={[
                  styles.changeText,
                  { color: change > 0 ? theme.colors.error : theme.colors.success }
                ]}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)} {entry.unit}
                </Text>
              </View>
            )}
          </View>
          
          {entry.notes && (
            <Text style={styles.entryNotes}>{entry.notes}</Text>
          )}
        </View>
      );
    });
  };

  const renderMeasurementsList = () => {
    return measurements.map(measurement => (
      <View key={measurement.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>
            {format(new Date(measurement.date), 'EEEE, MMMM d')}
          </Text>
          <TouchableOpacity onPress={() => deleteEntry(measurement.id)}>
            <Icon.Trash2 color={theme.colors.error} width={18} height={18} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.measurementGrid}>
          {Object.entries(measurement.measurements).map(([key, value]) => 
            value ? (
              <View key={key} style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
                <Text style={styles.measurementValue}>
                  {value} {measurement.unit}
                </Text>
              </View>
            ) : null
          )}
        </View>
        
        {measurement.notes && (
          <Text style={styles.entryNotes}>{measurement.notes}</Text>
        )}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {type === 'weight' && (
          <>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {(['week', 'month', 'year'] as const).map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              {renderWeightChart()}
            </View>

            {/* Weight List */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>History</Text>
              {weightEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon.TrendingUp color={theme.colors.gray[400]} width={48} height={48} />
                  <Text style={styles.emptyStateText}>No weight entries yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to add your first entry
                  </Text>
                </View>
              ) : (
                renderWeightList()
              )}
            </View>
          </>
        )}

        {type === 'measurements' && (
          <View style={styles.listContainer}>
            {measurements.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon.Maximize color={theme.colors.gray[400]} width={48} height={48} />
                <Text style={styles.emptyStateText}>No measurements yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button to add your first measurement
                </Text>
              </View>
            ) : (
              renderMeasurementsList()
            )}
          </View>
        )}

        {type === 'photos' && null}
      </ScrollView>

      {type !== 'photos' && (
        <FloatingActionButton
          onPress={() => navigation.navigate('AddMetric', { type })}
          icon={<Icon.Plus color="white" width={24} height={24} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[600],
  },
  periodButtonTextActive: {
    color: 'white',
  },
  chartContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  emptyChart: {
    height: 220,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderStyle: 'dashed',
  },
  emptyChartText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  listTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  entryDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.md,
  },
  entryWeight: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  changeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  entryNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  measurementItem: {
    width: '45%',
  },
  measurementLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[600],
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});