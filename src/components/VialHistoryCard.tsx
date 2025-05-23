import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Vial } from '@/types/peptide';
import { format, parseISO, differenceInDays } from 'date-fns';

interface VialHistoryCardProps {
  vial: Vial;
}

export default function VialHistoryCard({ vial }: VialHistoryCardProps) {
  const isExpired = vial.expirationDate ? new Date(vial.expirationDate) < new Date() : false;
  const isEmpty = vial.remainingAmountUnits <= 0;
  const usagePercentage = ((vial.initialAmountUnits - vial.remainingAmountUnits) / vial.initialAmountUnits) * 100;
  
  const getDaysActive = (): number => {
    const startDate = parseISO(vial.dateAdded);
    const endDate = vial.isActive ? new Date() : (vial.expirationDate ? parseISO(vial.expirationDate) : new Date());
    return differenceInDays(endDate, startDate);
  };

  const getStatusColor = () => {
    if (isExpired) return theme.colors.error;
    if (isEmpty) return theme.colors.gray[500];
    if (vial.isActive) return theme.colors.secondary;
    return theme.colors.gray[500];
  };

  const getStatusText = () => {
    if (isExpired) return 'Expired';
    if (isEmpty) return 'Empty';
    if (vial.isActive) return 'Active';
    return 'Inactive';
  };

  const getStatusIcon = () => {
    if (isExpired) return <Icon.AlertCircle stroke={getStatusColor()} width={16} height={16} />;
    if (isEmpty) return <Icon.Package stroke={getStatusColor()} width={16} height={16} />;
    if (vial.isActive) return <Icon.CheckCircle stroke={getStatusColor()} width={16} height={16} />;
    return <Icon.Circle stroke={getStatusColor()} width={16} height={16} />;
  };

  return (
    <View style={[styles.container, vial.isActive && styles.activeContainer]}>
      <View style={styles.header}>
        <Text style={styles.vialName}>{vial.name || `Vial ${vial.id.slice(0, 8)}`}</Text>
        <View style={styles.statusBadge}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Started:</Text>
          <Text style={styles.value}>{format(parseISO(vial.dateAdded), 'MMM d, yyyy')}</Text>
        </View>

        {vial.expirationDate && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Expires:</Text>
            <Text style={[styles.value, isExpired && styles.expiredText]}>
              {format(parseISO(vial.expirationDate), 'MMM d, yyyy')}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Days Active:</Text>
          <Text style={styles.value}>{getDaysActive()} days</Text>
        </View>

        {vial.reconstitutionBacWaterMl && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Reconstitution:</Text>
            <Text style={styles.value}>{vial.reconstitutionBacWaterMl} mL</Text>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>Usage:</Text>
            <Text style={styles.value}>
              {vial.initialAmountUnits - vial.remainingAmountUnits} / {vial.initialAmountUnits} doses
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${usagePercentage}%` }]} />
          </View>
        </View>

        {vial.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{vial.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  activeContainer: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  vialName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  content: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  value: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  expiredText: {
    color: theme.colors.error,
  },
  progressSection: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  notesSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  notesLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[700],
    lineHeight: 20,
  },
});