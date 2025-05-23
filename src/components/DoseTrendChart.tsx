import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '@/constants/theme';
import { DoseLog } from '@/types/peptide';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';

interface DoseTrendChartProps {
  doseLogs: DoseLog[];
  typicalDose?: number;
  unit?: string;
}

const screenWidth = Dimensions.get('window').width;

export default function DoseTrendChart({ doseLogs, typicalDose, unit = 'units' }: DoseTrendChartProps) {
  const chartData = useMemo(() => {
    // Get last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group doses by date
    const dosesByDate = new Map<string, number>();
    
    doseLogs.forEach(log => {
      const dateKey = format(parseISO(log.date), 'yyyy-MM-dd');
      const currentTotal = dosesByDate.get(dateKey) || 0;
      dosesByDate.set(dateKey, currentTotal + log.dosage);
    });
    
    // Create labels and data points
    const labels: string[] = [];
    const data: number[] = [];
    
    // Sample every 5 days for cleaner chart
    allDays.forEach((day, index) => {
      if (index % 5 === 0 || index === allDays.length - 1) {
        labels.push(format(day, 'MMM d'));
        const dateKey = format(day, 'yyyy-MM-dd');
        data.push(dosesByDate.get(dateKey) || 0);
      }
    });
    
    return { labels, data };
  }, [doseLogs]);

  if (doseLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No dose history to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.data,
              strokeWidth: 2,
            },
          ],
        }}
        width={screenWidth - theme.spacing.lg * 2}
        height={220}
        yAxisSuffix={` ${unit}`}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.background,
          backgroundGradientTo: theme.colors.background,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Primary color
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray color
          style: {
            borderRadius: theme.borderRadius.md,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: '5,5',
            stroke: theme.colors.gray[200],
            strokeWidth: 1,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: theme.borderRadius.md,
        }}
        fromZero
        segments={5}
      />
      
      {typicalDose && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Daily Total</Text>
          </View>
          <Text style={styles.typicalDoseText}>
            Typical dose: {typicalDose} {unit}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  typicalDoseText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
});