import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Peptide, Vial, DoseLog } from '@/types/peptide';
import { RootStackParamList } from '@/navigation/RootNavigator';
import VialHistoryCard from '@/components/VialHistoryCard';
import DoseTrendChart from '@/components/DoseTrendChart';
import RemainingDosesVisualization from '@/components/RemainingDosesVisualization';
import { format, parseISO, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { inventoryService } from '@/services/inventory.service';
import { AppHaptics } from '@/utils/haptics';
import { calculateRemainingDoses } from '@/utils/dose-calculations';

type PeptideDetailsRouteProp = RouteProp<RootStackParamList, 'PeptideDetails'>;
type PeptideDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'PeptideDetails'>;

export default function PeptideDetailsScreen() {
  const route = useRoute<PeptideDetailsRouteProp>();
  const navigation = useNavigation<PeptideDetailsNavigationProp>();
  const { peptideId } = route.params;
  const { peptides, inventoryPeptides, loading, refreshData } = useData();
  const { service } = useDatabase();
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'stats'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  const peptide = peptides.find(p => p.id === peptideId);
  const inventoryPeptide = inventoryPeptides.find(ip => ip.id === peptideId);
  const activeVial = peptide?.vials?.find(v => v.isActive);
  const remainingDoses = calculateRemainingDoses(peptide, inventoryPeptide);
  
  useEffect(() => {
    if (peptide) {
      navigation.setOptions({ 
        title: peptide.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleDeletePeptide}
            style={{ marginRight: theme.spacing.md }}
          >
            <Icon.Trash2 
              width={24} 
              height={24} 
              stroke={theme.colors.error}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [peptide, navigation, handleDeletePeptide]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDeletePeptide = useCallback(() => {
    if (!peptide) return;
    
    AppHaptics.delete();
    Alert.alert(
      'Delete Peptide',
      `Are you sure you want to delete ${peptide.name}? This will remove all associated data including dose history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryService.deletePeptideFromInventory(peptide.id, peptide.name);
              AppHaptics.success();
              navigation.goBack();
              await refreshData();
            } catch (error) {
              AppHaptics.error();
              Alert.alert('Error', 'Failed to delete peptide');
            }
          },
        },
      ]
    );
  }, [peptide, navigation, refreshData]);

  const getDosesThisWeek = (): number => {
    if (!peptide?.doseLogs) return 0;
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    return peptide.doseLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
    }).length;
  };

  const getComplianceRate = (): number => {
    if (!peptide?.schedule || !peptide?.doseLogs) return 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let expectedDoses = 0;
    let actualDoses = 0;
    
    // Calculate expected doses based on schedule
    const currentDate = new Date(thirtyDaysAgo);
    const today = new Date();
    
    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();
      
      if (peptide.schedule.frequency === 'daily') {
        expectedDoses += peptide.schedule.times.length;
      } else if (peptide.schedule.frequency === 'specific_days' && peptide.schedule.daysOfWeek?.includes(dayOfWeek as any)) {
        expectedDoses += peptide.schedule.times.length;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count actual doses in the same period
    actualDoses = peptide.doseLogs.filter(log => {
      const logDate = parseISO(log.date);
      return logDate >= thirtyDaysAgo && logDate <= today;
    }).length;
    
    return expectedDoses > 0 ? Math.round((actualDoses / expectedDoses) * 100) : 0;
  };

  const handleActivateNewVial = async () => {
    if (!peptide || !inventoryPeptide) {
      Alert.alert('Error', 'Cannot activate vial - peptide data not found');
      return;
    }

    if (inventoryPeptide.num_vials <= 0) {
      AppHaptics.error();
      Alert.alert('No Vials', 'No vials available to activate');
      return;
    }

    // Check if there's already an active vial with doses remaining
    if (activeVial && remainingDoses > 0) {
      Alert.alert(
        'Active Vial Exists',
        `There's already an active vial with ${remainingDoses} doses remaining. Do you want to activate a new vial anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithActivation() }
        ]
      );
      return;
    }

    proceedWithActivation();
  };

  const proceedWithActivation = () => {
    AppHaptics.activateVial();
    
    // Prompt for BAC water amount
    Alert.prompt(
      'Activate New Vial',
      `Enter the amount of BAC water (mL) to reconstitute ${peptide?.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async (bacWaterAmount) => {
            if (!bacWaterAmount || isNaN(parseFloat(bacWaterAmount))) {
              Alert.alert('Error', 'Please enter a valid amount');
              return;
            }

            try {
              await inventoryService.activatePeptideVial(
                peptide!.id, 
                new Date().toISOString(),
                parseFloat(bacWaterAmount)
              );
              AppHaptics.success();
              await refreshData();
              Alert.alert('Success', 'New vial activated successfully!');
            } catch (error) {
              AppHaptics.error();
              console.error('Error activating vial:', error);
              Alert.alert('Error', 'Failed to activate vial');
            }
          },
        },
      ],
      'plain-text',
      '3', // Default to 3mL for NAD+
      'numeric'
    );
  };

  if (loading || !peptide) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.peptideName}>{peptide.name}</Text>
        <Text style={styles.strength}>{peptide.strength}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
          onPress={() => setSelectedTab('stats')}
        >
          <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {selectedTab === 'overview' && (
          <>
            {/* Active Vial Status */}
            {activeVial && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Vial</Text>
                <RemainingDosesVisualization
                  initialDoses={activeVial.initialAmountUnits}
                  remainingDoses={remainingDoses}
                />
                <View style={styles.vialInfo}>
                  <View style={styles.vialInfoRow}>
                    <Text style={styles.vialInfoLabel}>Started:</Text>
                    <Text style={styles.vialInfoValue}>
                      {format(parseISO(activeVial.dateAdded), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  {activeVial.expirationDate && (
                    <View style={styles.vialInfoRow}>
                      <Text style={styles.vialInfoLabel}>Expires:</Text>
                      <Text style={styles.vialInfoValue}>
                        {format(parseISO(activeVial.expirationDate), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.vialInfoRow}>
                    <Text style={styles.vialInfoLabel}>Reconstitution:</Text>
                    <Text style={styles.vialInfoValue}>
                      {activeVial.reconstitutionBacWaterMl || 0} mL BAC water
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Icon.Calendar stroke={theme.colors.primary} width={24} height={24} />
                  <Text style={styles.statValue}>{getDosesThisWeek()}</Text>
                  <Text style={styles.statLabel}>Doses This Week</Text>
                </View>
                <View style={styles.statCard}>
                  <Icon.TrendingUp stroke={theme.colors.primary} width={24} height={24} />
                  <Text style={styles.statValue}>{getComplianceRate()}%</Text>
                  <Text style={styles.statLabel}>Compliance Rate</Text>
                </View>
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleText}>
                  {peptide.schedule.frequency === 'daily' ? 'Daily' : 'Specific Days'}
                </Text>
                {peptide.schedule.times.map((time, index) => (
                  <View key={index} style={styles.scheduleTime}>
                    <Icon.Clock stroke={theme.colors.gray[500]} width={16} height={16} />
                    <Text style={styles.scheduleTimeText}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Inventory Info */}
            {inventoryPeptide && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inventory</Text>
                <View style={styles.inventoryInfo}>
                  <View style={styles.inventoryRow}>
                    <Icon.Package stroke={theme.colors.gray[500]} width={18} height={18} />
                    <Text style={styles.inventoryLabel}>Remaining Stock:</Text>
                    <Text style={styles.inventoryValue}>{inventoryPeptide.num_vials} vials</Text>
                  </View>
                  {inventoryPeptide.active_vial_status === 'IN_USE' && (
                    <View style={styles.inventoryRow}>
                      <Icon.CheckCircle stroke={theme.colors.secondary} width={18} height={18} />
                      <Text style={styles.inventoryLabel}>Active Vial:</Text>
                      <Text style={[styles.inventoryValue, { color: theme.colors.secondary }]}>1 in use</Text>
                    </View>
                  )}
                  {inventoryPeptide.concentration_per_vial_mcg && (
                    <View style={styles.inventoryRow}>
                      <Icon.Activity stroke={theme.colors.gray[500]} width={18} height={18} />
                      <Text style={styles.inventoryLabel}>Concentration:</Text>
                      <Text style={styles.inventoryValue}>
                        {inventoryPeptide.concentration_per_vial_mcg}mcg/vial
                      </Text>
                    </View>
                  )}
                  <View style={styles.inventoryNote}>
                    <Text style={styles.inventoryNoteText}>
                      {inventoryPeptide.active_vial_status === 'IN_USE' 
                        ? `Total: ${inventoryPeptide.num_vials} remaining + 1 active = ${inventoryPeptide.num_vials + 1} vials`
                        : `Total stock: ${inventoryPeptide.num_vials} vials`}
                    </Text>
                  </View>
                </View>
                
                {/* Actions */}
                {inventoryPeptide.num_vials > 0 && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleActivateNewVial}>
                    <Icon.Plus stroke="white" width={20} height={20} />
                    <Text style={styles.actionButtonText}>Activate New Vial</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {selectedTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vial History</Text>
            {peptide.vials && peptide.vials.length > 0 ? (
              peptide.vials
                .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                .map((vial) => (
                  <VialHistoryCard key={vial.id} vial={vial} />
                ))
            ) : (
              <Text style={styles.emptyText}>No vial history available</Text>
            )}
          </View>
        )}

        {selectedTab === 'stats' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dose Trends</Text>
              <DoseTrendChart 
                doseLogs={peptide.doseLogs || []} 
                typicalDose={peptide.typicalDosageUnits}
                unit={peptide.dosageUnit}
              />
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Doses Logged:</Text>
                  <Text style={styles.summaryValue}>{peptide.doseLogs?.length || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Typical Dose:</Text>
                  <Text style={styles.summaryValue}>
                    {peptide.typicalDosageUnits} {peptide.dosageUnit}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vials Used:</Text>
                  <Text style={styles.summaryValue}>{peptide.vials?.length || 0}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  peptideName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.xs,
  },
  strength: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  vialInfo: {
    marginTop: theme.spacing.md,
  },
  vialInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  vialInfoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  vialInfoValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.xs,
  },
  scheduleInfo: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  scheduleText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  scheduleTimeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  actionButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  inventoryInfo: {
    gap: theme.spacing.sm,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inventoryLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    flex: 1,
  },
  inventoryValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  inventoryNote: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  inventoryNoteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
});