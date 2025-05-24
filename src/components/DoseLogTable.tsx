import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';
import { Peptide, DoseLog } from '@/types/peptide';
import { format, parseISO } from 'date-fns';
import * as Icon from 'react-native-feather';

interface DoseLogTableProps {
  peptides: Peptide[];
  dateRange: { start: Date; end: Date };
  selectedPeptideId?: string;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

interface FlattenedDoseLog {
  peptideName: string;
  date: string;
  time: string;
  dosage: number;
  unit: string;
  volumeDrawn?: number;
  logDate: Date;
}

export default function DoseLogTable({ 
  peptides, 
  dateRange, 
  selectedPeptideId,
  onSort,
  sortColumn = 'date',
  sortDirection = 'desc'
}: DoseLogTableProps) {
  
  // Flatten dose logs from all peptides
  const flattenedLogs: FlattenedDoseLog[] = [];
  
  peptides.forEach(peptide => {
    // Filter by selected peptide if provided
    if (selectedPeptideId && peptide.id !== selectedPeptideId) return;
    
    peptide.doseLogs?.forEach(log => {
      const logDate = new Date(log.date);
      
      // Filter by date range
      if (logDate >= dateRange.start && logDate <= dateRange.end) {
        flattenedLogs.push({
          peptideName: peptide.name,
          date: format(parseISO(log.date), 'MMM d, yyyy'),
          time: log.timeOfDay || 'N/A',
          dosage: log.dosage,
          unit: log.unit || peptide.dosageUnit || 'units',
          volumeDrawn: log.volumeDrawnMl,
          logDate: logDate
        });
      }
    });
  });
  
  // Sort logs
  const sortedLogs = [...flattenedLogs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case 'peptide':
        comparison = a.peptideName.localeCompare(b.peptideName);
        break;
      case 'date':
        comparison = a.logDate.getTime() - b.logDate.getTime();
        break;
      case 'time':
        comparison = (a.time || '').localeCompare(b.time || '');
        break;
      case 'dosage':
        comparison = a.dosage - b.dosage;
        break;
      default:
        comparison = a.logDate.getTime() - b.logDate.getTime();
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <Icon.ChevronDown stroke={theme.colors.gray[400]} width={14} height={14} />;
    }
    
    return sortDirection === 'asc' 
      ? <Icon.ChevronUp stroke={theme.colors.primary} width={14} height={14} />
      : <Icon.ChevronDown stroke={theme.colors.primary} width={14} height={14} />;
  };
  
  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };
  
  if (sortedLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon.FileText stroke={theme.colors.gray[400]} width={48} height={48} />
        <Text style={styles.emptyText}>No dose logs found for the selected period</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={[styles.headerCell, styles.peptideCell]} 
          onPress={() => handleSort('peptide')}
        >
          <Text style={styles.headerText}>Peptide</Text>
          {renderSortIcon('peptide')}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerCell, styles.dateCell]} 
          onPress={() => handleSort('date')}
        >
          <Text style={styles.headerText}>Date</Text>
          {renderSortIcon('date')}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerCell, styles.timeCell]} 
          onPress={() => handleSort('time')}
        >
          <Text style={styles.headerText}>Time</Text>
          {renderSortIcon('time')}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerCell, styles.dosageCell]} 
          onPress={() => handleSort('dosage')}
        >
          <Text style={styles.headerText}>Dosage</Text>
          {renderSortIcon('dosage')}
        </TouchableOpacity>
        
        <View style={[styles.headerCell, styles.unitCell]}>
          <Text style={styles.headerText}>Unit</Text>
        </View>
        
        <View style={[styles.headerCell, styles.volumeCell]}>
          <Text style={styles.headerText}>Volume</Text>
        </View>
      </View>
      
      {/* Table Body */}
      <ScrollView 
        style={styles.tableBody}
        showsVerticalScrollIndicator={true}
      >
        {sortedLogs.map((log, index) => (
          <View 
            key={`${log.peptideName}-${log.date}-${log.time}-${index}`}
            style={[
              styles.dataRow,
              index % 2 === 0 && styles.evenRow
            ]}
          >
            <View style={[styles.dataCell, styles.peptideCell]}>
              <Text style={styles.peptideText} numberOfLines={1}>
                {log.peptideName}
              </Text>
            </View>
            
            <View style={[styles.dataCell, styles.dateCell]}>
              <Text style={styles.dataText}>{log.date}</Text>
            </View>
            
            <View style={[styles.dataCell, styles.timeCell]}>
              <View style={[
                styles.timeBadge,
                log.time === 'AM' ? styles.amBadge : styles.pmBadge
              ]}>
                <Text style={styles.timeText}>{log.time}</Text>
              </View>
            </View>
            
            <View style={[styles.dataCell, styles.dosageCell]}>
              <Text style={styles.dosageText}>{log.dosage}</Text>
            </View>
            
            <View style={[styles.dataCell, styles.unitCell]}>
              <Text style={styles.dataText}>{log.unit}</Text>
            </View>
            
            <View style={[styles.dataCell, styles.volumeCell]}>
              <Text style={styles.dataText}>
                {log.volumeDrawn ? `${log.volumeDrawn.toFixed(2)} mL` : 'N/A'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Summary Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total Doses: {sortedLogs.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[50],
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.gray[200],
    paddingVertical: theme.spacing.sm,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  tableBody: {
    flex: 1,
    maxHeight: 400,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    paddingVertical: theme.spacing.sm,
  },
  evenRow: {
    backgroundColor: theme.colors.gray[50],
  },
  dataCell: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  dataText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  peptideText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  dosageText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timeBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  amBadge: {
    backgroundColor: theme.colors.primaryLight,
  },
  pmBadge: {
    backgroundColor: theme.colors.secondaryLight,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.gray[700],
  },
  footer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  // Column widths
  peptideCell: {
    flex: 2.5,
  },
  dateCell: {
    flex: 2,
  },
  timeCell: {
    flex: 1,
    alignItems: 'center',
  },
  dosageCell: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  unitCell: {
    flex: 1,
  },
  volumeCell: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
});