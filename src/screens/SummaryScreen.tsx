import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/ui/Card';
import SegmentedControl from '@/components/ui/SegmentedControl';
import DoseLogTable from '@/components/DoseLogTable';
import { DateRangePickerModal } from '@/components/DateRangePickerModal';
import { useData } from '@/contexts/DataContext';
import * as Icon from 'react-native-feather';
import { format } from 'date-fns';
import { exportDoseHistoryAsCSV } from '@/utils/export-utils';
import { Alert } from 'react-native';

// Helper function to normalize day values to numbers
const normalizeDaysOfWeek = (days: any[]): number[] => {
  if (!days || !Array.isArray(days)) return [];
  
  const dayNameToIndex: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };
  
  return days.map(day => {
    if (typeof day === 'number') {
      return day;
    } else if (typeof day === 'string') {
      const index = dayNameToIndex[day.toLowerCase()];
      return index !== undefined ? index : -1;
    }
    return -1;
  }).filter(day => day >= 0 && day <= 6);
};

// Helper function to get date range
const getDateRange = (period: string): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 7); // default to week
  }
  
  return { start, end };
};

export default function SummaryScreen() {
  const { peptides, refreshData, loading } = useData();
  const [timePeriod, setTimePeriod] = useState<string>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPeptideId, setSelectedPeptideId] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState(() => getDateRange('week'));
  
  // Summary stats
  const [totalDoses, setTotalDoses] = useState(0);
  const [compliance, setCompliance] = useState(0);
  const [peptideStats, setPeptideStats] = useState<Array<{
    id: string;
    name: string;
    doseCount: number;
    vialStatus: string;
    remainingPercentage: number;
    compliance: number;
  }>>([]);
  
  // Generate summary stats
  useEffect(() => {
    if (!peptides || peptides.length === 0) return;
    
    const { start, end } = dateRange;
    
    // Calculate total doses in period
    let dosesInPeriod = 0;
    let totalExpectedDoses = 0;
    let totalLoggedDoses = 0;
    
    const peptideStatsArray: Array<{
      id: string;
      name: string;
      doseCount: number;
      vialStatus: string;
      remainingPercentage: number;
      compliance: number;
    }> = [];
    
    peptides.forEach(peptide => {
      const doses = peptide.doseLogs?.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      }) || [];
      
      // Calculate doses for this peptide
      const peptideDoseCount = doses.length;
      dosesInPeriod += peptideDoseCount;
      
      // Calculate expected doses based on schedule
      let expectedDoses = 0;
      if (peptide.schedule) {
        const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine how many days per week this peptide is scheduled
        let daysPerWeek = 0;
        if (peptide.schedule.frequency === 'daily') {
          daysPerWeek = 7;
        } else if (peptide.schedule.frequency === 'specific_days' && peptide.schedule.daysOfWeek) {
          const normalizedDays = normalizeDaysOfWeek(peptide.schedule.daysOfWeek);
          daysPerWeek = normalizedDays.length;
        }
        
        // Calculate expected doses based on schedule
        if (daysPerWeek > 0) {
          const weeksInPeriod = daysInPeriod / 7;
          expectedDoses = Math.floor(weeksInPeriod * daysPerWeek);
          
          // Add partial week doses
          const remainingDays = daysInPeriod % 7;
          if (peptide.schedule.frequency === 'daily') {
            expectedDoses += remainingDays;
          } else if (peptide.schedule.daysOfWeek) {
            // Count how many scheduled days fall within the remaining days
            const normalizedDays = normalizeDaysOfWeek(peptide.schedule.daysOfWeek);
            const startDayOfWeek = start.getDay();
            for (let i = 0; i < remainingDays; i++) {
              const checkDay = (startDayOfWeek + i) % 7;
              if (normalizedDays.includes(checkDay)) {
                expectedDoses++;
              }
            }
          }
        }
      }
      
      totalExpectedDoses += expectedDoses;
      totalLoggedDoses += peptideDoseCount;
      
      // Calculate compliance percentage
      const peptideCompliance = expectedDoses > 0 ? (peptideDoseCount / expectedDoses) * 100 : 0;
      
      // Get active vial status
      const activeVial = peptide.vials?.find(v => v.isActive);
      let vialStatus = 'No Active Vial';
      let remainingPercentage = 0;
      
      if (activeVial) {
        if (activeVial.remainingAmountUnits <= 0) {
          vialStatus = 'Empty';
        } else if (activeVial.expirationDate && new Date(activeVial.expirationDate) < new Date()) {
          vialStatus = 'Expired';
        } else {
          vialStatus = 'Active';
          // Calculate percentage remaining
          remainingPercentage = activeVial.remainingAmountUnits / activeVial.initialAmountUnits * 100;
        }
      }
      
      peptideStatsArray.push({
        id: peptide.id,
        name: peptide.name,
        doseCount: peptideDoseCount,
        vialStatus,
        remainingPercentage,
        compliance: peptideCompliance,
      });
    });
    
    // Sort peptides by dose count (most used first)
    peptideStatsArray.sort((a, b) => b.doseCount - a.doseCount);
    
    // Calculate overall compliance
    const overallCompliance = totalExpectedDoses > 0 ? (totalLoggedDoses / totalExpectedDoses) * 100 : 0;
    
    setTotalDoses(dosesInPeriod);
    setCompliance(overallCompliance);
    setPeptideStats(peptideStatsArray);
  }, [peptides, dateRange]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const handleExport = async () => {
    try {
      await exportDoseHistoryAsCSV({
        peptides,
        dateRange,
        selectedPeptideId
      });
      Alert.alert('Success', 'Dose history exported successfully');
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Failed to export dose history');
    }
  };
  
  const renderVialStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Icon.CheckCircle color={theme.colors.secondary} width={16} height={16} />;
      case 'Empty':
        return <Icon.AlertCircle color={theme.colors.error} width={16} height={16} />;
      case 'Expired':
        return <Icon.Clock color={theme.colors.warning} width={16} height={16} />;
      default:
        return <Icon.Circle color={theme.colors.gray[400]} width={16} height={16} />;
    }
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  const activeVialCount = peptideStats.filter(stat => stat.vialStatus === 'Active').length;
  const expiredVialCount = peptideStats.filter(stat => stat.vialStatus === 'Expired').length;
  
  return (
    <>
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
      <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Usage Summary</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'summary' && styles.activeToggle]}
              onPress={() => setViewMode('summary')}
            >
              <Icon.BarChart2 
                stroke={viewMode === 'summary' ? theme.colors.primary : theme.colors.gray[500]} 
                width={18} 
                height={18} 
              />
              <Text style={[styles.toggleText, viewMode === 'summary' && styles.activeToggleText]}>
                Summary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'detailed' && styles.activeToggle]}
              onPress={() => setViewMode('detailed')}
            >
              <Icon.List 
                stroke={viewMode === 'detailed' ? theme.colors.primary : theme.colors.gray[500]} 
                width={18} 
                height={18} 
              />
              <Text style={[styles.toggleText, viewMode === 'detailed' && styles.activeToggleText]}>
                Detailed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Date Range Selector */}
        <TouchableOpacity
          style={styles.dateRangeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon.Calendar color={theme.colors.primary} width={18} height={18} />
          <Text style={styles.dateRangeText}>
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </Text>
          <Icon.ChevronDown color={theme.colors.textSecondary} width={16} height={16} />
        </TouchableOpacity>
        
        {viewMode === 'summary' ? (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryCardsContainer}>
              <Card style={[styles.summaryCard, styles.totalDosesCard]} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <Icon.Activity color={theme.colors.primary} width={24} height={24} />
                </View>
                <Text style={styles.summaryCardValue}>{totalDoses}</Text>
                <Text style={styles.summaryCardLabel}>Total Doses</Text>
                <View style={styles.cardAccent} />
              </Card>
              
              <Card style={[styles.summaryCard, styles.complianceCard]} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <Icon.Target color={theme.colors.success} width={24} height={24} />
                </View>
                <Text style={styles.summaryCardValue}>{Math.round(compliance)}%</Text>
                <Text style={styles.summaryCardLabel}>Compliance</Text>
                <View style={[styles.cardAccent, { backgroundColor: theme.colors.success }]} />
              </Card>
              
              <Card style={[styles.summaryCard, styles.activeVialsCard]} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <Icon.Package color={theme.colors.secondary} width={24} height={24} />
                </View>
                <Text style={styles.summaryCardValue}>{activeVialCount}</Text>
                <Text style={styles.summaryCardLabel}>Active Vials</Text>
                <View style={[styles.cardAccent, { backgroundColor: theme.colors.secondary }]} />
              </Card>
              
              <Card style={[styles.summaryCard, styles.expiredVialsCard]} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <Icon.AlertCircle color={theme.colors.warning} width={24} height={24} />
                </View>
                <Text style={styles.summaryCardValue}>{expiredVialCount}</Text>
                <Text style={styles.summaryCardLabel}>Expired</Text>
                <View style={[styles.cardAccent, { backgroundColor: theme.colors.warning }]} />
              </Card>
            </View>
            
            {/* Peptide Stats */}
            <Text style={styles.sectionTitle}>Peptide Activity</Text>
            
            {peptideStats.length === 0 ? (
              <Card style={styles.emptyCard} variant="elevated">
                <Text style={styles.emptyCardText}>No peptide activity in this time period</Text>
              </Card>
            ) : (
              peptideStats.map(stat => (
                <Card key={stat.id} style={styles.peptideCard} variant="elevated">
                  <View style={styles.peptideCardHeader}>
                    <View style={styles.peptideNameContainer}>
                      <View style={[styles.peptideColorIndicator, { backgroundColor: theme.colors.primary }]} />
                      <Text style={styles.peptideName}>{stat.name}</Text>
                    </View>
                    <View style={styles.vialStatus}>
                      {renderVialStatusIcon(stat.vialStatus)}
                      <Text style={styles.vialStatusText}>{stat.vialStatus}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.peptideStats}>
                    <View style={styles.doseStat}>
                      <Icon.TrendingUp color={theme.colors.gray[400]} width={16} height={16} />
                      <Text style={styles.doseStatValue}>{stat.doseCount}</Text>
                      <Text style={styles.doseStatLabel}>Doses</Text>
                    </View>
                    
                    <View style={styles.doseStat}>
                      <Icon.Target color={stat.compliance >= 80 ? theme.colors.success : theme.colors.warning} width={16} height={16} />
                      <Text style={styles.doseStatValue}>{Math.round(stat.compliance)}%</Text>
                      <Text style={styles.doseStatLabel}>Compliance</Text>
                    </View>
                    
                    {stat.vialStatus === 'Active' && (
                      <View style={styles.remainingContainer}>
                        <View style={styles.remainingTrack}>
                          <View 
                            style={[
                              styles.remainingFill, 
                              { 
                                width: `${stat.remainingPercentage}%`,
                                backgroundColor: stat.remainingPercentage < 25 
                                  ? theme.colors.warning 
                                  : theme.colors.secondary
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.remainingText}>
                          {Math.round(stat.remainingPercentage)}% remaining
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            {/* Export Button */}
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
            >
              <Icon.Download color={theme.colors.primary} width={18} height={18} />
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </TouchableOpacity>
            
            {/* Peptide Filter */}
            <View style={styles.filterContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <TouchableOpacity
                  style={[styles.filterChip, !selectedPeptideId && styles.filterChipActive]}
                  onPress={() => setSelectedPeptideId(undefined)}
                >
                  <Text style={[styles.filterChipText, !selectedPeptideId && styles.filterChipTextActive]}>
                    All Peptides
                  </Text>
                </TouchableOpacity>
                {peptides.map(peptide => (
                  <TouchableOpacity
                    key={peptide.id}
                    style={[styles.filterChip, selectedPeptideId === peptide.id && styles.filterChipActive]}
                    onPress={() => setSelectedPeptideId(peptide.id)}
                  >
                    <Text style={[styles.filterChipText, selectedPeptideId === peptide.id && styles.filterChipTextActive]}>
                      {peptide.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Detailed Dose Log Table */}
            <DoseLogTable
              peptides={peptides}
              dateRange={dateRange}
              selectedPeptideId={selectedPeptideId}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
          </>
        )}
      </View>
      </ScrollView>
      
      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(start, end) => {
          setDateRange({ start, end });
          setShowDatePicker(false);
        }}
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
      />
    </>
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
  section: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  periodSelector: {
    marginBottom: theme.spacing.lg,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dateRangeText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.colors.primary,
  },
  totalDosesCard: {
    backgroundColor: theme.colors.primaryLight,
  },
  complianceCard: {
    backgroundColor: '#E8F5E9', // Light green
  },
  activeVialsCard: {
    backgroundColor: theme.colors.secondaryLight,
  },
  expiredVialsCard: {
    backgroundColor: '#FFEFD5', // Light orange/peach
  },
  summaryCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyCardText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  peptideCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  peptideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  peptideNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  peptideColorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  peptideName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  vialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vialStatusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginLeft: 4,
  },
  peptideStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doseStat: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 60,
  },
  doseStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  doseStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
  },
  remainingContainer: {
    flex: 1,
  },
  remainingTrack: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  remainingFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[600],
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md - 2,
    gap: theme.spacing.xs,
  },
  activeToggle: {
    backgroundColor: theme.colors.background,
    shadowColor: theme.colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    fontWeight: '500',
  },
  activeToggleText: {
    color: theme.colors.primary,
  },
  filterContainer: {
    marginBottom: theme.spacing.md,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
});