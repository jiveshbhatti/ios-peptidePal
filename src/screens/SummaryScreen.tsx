import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { theme } from '@/constants/theme';
import Card from '@/components/ui/Card';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useData } from '@/contexts/DataContext';
import * as Icon from 'react-native-feather';

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
  
  // Summary stats
  const [totalDoses, setTotalDoses] = useState(0);
  const [peptideStats, setPeptideStats] = useState<Array<{
    id: string;
    name: string;
    doseCount: number;
    vialStatus: string;
    remainingPercentage: number;
  }>>([]);
  
  // Generate summary stats
  useEffect(() => {
    if (!peptides || peptides.length === 0) return;
    
    const { start, end } = getDateRange(timePeriod);
    
    // Calculate total doses in period
    let dosesInPeriod = 0;
    const peptideStatsArray: Array<{
      id: string;
      name: string;
      doseCount: number;
      vialStatus: string;
      remainingPercentage: number;
    }> = [];
    
    peptides.forEach(peptide => {
      const doses = peptide.doseLogs?.filter(log => {
        const logDate = new Date(log.loggedAt);
        return logDate >= start && logDate <= end;
      }) || [];
      
      // Calculate doses for this peptide
      const peptideDoseCount = doses.length;
      dosesInPeriod += peptideDoseCount;
      
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
      });
    });
    
    // Sort peptides by dose count (most used first)
    peptideStatsArray.sort((a, b) => b.doseCount - a.doseCount);
    
    setTotalDoses(dosesInPeriod);
    setPeptideStats(peptideStatsArray);
  }, [peptides, timePeriod]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
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
        <Text style={styles.title}>Usage Summary</Text>
        
        <SegmentedControl
          options={['Week', 'Month', 'Quarter', 'Year']}
          selectedIndex={['week', 'month', 'quarter', 'year'].indexOf(timePeriod)}
          onChange={(index) => setTimePeriod(['week', 'month', 'quarter', 'year'][index])}
          style={styles.periodSelector}
        />
        
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <Card style={[styles.summaryCard, styles.totalDosesCard]} variant="elevated">
            <Text style={styles.summaryCardValue}>{totalDoses}</Text>
            <Text style={styles.summaryCardLabel}>Total Doses</Text>
          </Card>
          
          <Card style={[styles.summaryCard, styles.activeVialsCard]} variant="elevated">
            <Text style={styles.summaryCardValue}>{activeVialCount}</Text>
            <Text style={styles.summaryCardLabel}>Active Vials</Text>
          </Card>
          
          <Card style={[styles.summaryCard, styles.expiredVialsCard]} variant="elevated">
            <Text style={styles.summaryCardValue}>{expiredVialCount}</Text>
            <Text style={styles.summaryCardLabel}>Expired Vials</Text>
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
                <Text style={styles.peptideName}>{stat.name}</Text>
                <View style={styles.vialStatus}>
                  {renderVialStatusIcon(stat.vialStatus)}
                  <Text style={styles.vialStatusText}>{stat.vialStatus}</Text>
                </View>
              </View>
              
              <View style={styles.peptideStats}>
                <View style={styles.doseStat}>
                  <Text style={styles.doseStatValue}>{stat.doseCount}</Text>
                  <Text style={styles.doseStatLabel}>Doses</Text>
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
  },
  totalDosesCard: {
    backgroundColor: theme.colors.primaryLight,
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
});