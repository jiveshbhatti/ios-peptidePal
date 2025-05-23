import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Vial } from '@/types/peptide';
import { format, parseISO, differenceInDays } from 'date-fns';
import { AppHaptics } from '@/utils/haptics';

interface VialHistoryCardProps {
  vial: Vial;
  peptideId: string;
  onEdit?: (vial: Vial) => void;
  onDelete?: (vialId: string) => void;
  onDiscard?: (vialId: string, reason: string) => void;
}

export default function VialHistoryCard({ vial, peptideId, onEdit, onDelete, onDiscard }: VialHistoryCardProps) {
  const isExpired = vial.expirationDate ? new Date(vial.expirationDate) < new Date() : false;
  const isEmpty = vial.remainingAmountUnits <= 0;
  const usagePercentage = ((vial.initialAmountUnits - vial.remainingAmountUnits) / vial.initialAmountUnits) * 100;
  const isDiscarded = vial.discardedAt || vial.discardReason;
  
  // Calculate days until expiry for warning
  const daysUntilExpiry = vial.expirationDate 
    ? differenceInDays(parseISO(vial.expirationDate), new Date())
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  
  const getDaysActive = (): number => {
    const startDate = parseISO(vial.dateAdded);
    const endDate = vial.isActive ? new Date() : (vial.expirationDate ? parseISO(vial.expirationDate) : new Date());
    return differenceInDays(endDate, startDate);
  };

  const getStatusColor = () => {
    if (isDiscarded) return theme.colors.gray[400];
    if (isExpired) return theme.colors.error;
    if (isExpiringSoon) return theme.colors.warning || '#F59E0B';
    if (isEmpty) return theme.colors.gray[500];
    if (vial.isActive) return theme.colors.secondary;
    return theme.colors.gray[500];
  };

  const getStatusText = () => {
    if (isDiscarded) return 'Discarded';
    if (isExpired) return 'Expired';
    if (isExpiringSoon) return `Expires in ${daysUntilExpiry} days`;
    if (isEmpty) return 'Empty';
    if (vial.isActive) return 'Active';
    return 'Inactive';
  };

  const getStatusIcon = () => {
    if (isDiscarded) return <Icon.XCircle stroke={getStatusColor()} width={16} height={16} />;
    if (isExpired) return <Icon.AlertCircle stroke={getStatusColor()} width={16} height={16} />;
    if (isExpiringSoon) return <Icon.AlertTriangle stroke={getStatusColor()} width={16} height={16} />;
    if (isEmpty) return <Icon.Package stroke={getStatusColor()} width={16} height={16} />;
    if (vial.isActive) return <Icon.CheckCircle stroke={getStatusColor()} width={16} height={16} />;
    return <Icon.Circle stroke={getStatusColor()} width={16} height={16} />;
  };

  const handleEdit = () => {
    AppHaptics.buttonTap();
    if (onEdit) {
      onEdit(vial);
    }
  };

  const handleDelete = () => {
    AppHaptics.buttonTap();
    Alert.alert(
      'Delete Vial',
      'Are you sure you want to delete this vial? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(vial.id);
            }
          }
        }
      ]
    );
  };

  const handleDiscard = () => {
    AppHaptics.buttonTap();
    const reasons = [
      'Expired',
      'Contaminated',
      'Damaged',
      'Lost',
      'Other'
    ];
    
    Alert.alert(
      'Discard Vial',
      'Why are you discarding this vial?',
      reasons.map(reason => ({
        text: reason,
        onPress: () => {
          if (reason === 'Other') {
            Alert.prompt(
              'Discard Reason',
              'Please specify the reason:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: (customReason) => {
                    if (onDiscard) {
                      onDiscard(vial.id, customReason || 'Other reason');
                    }
                  }
                }
              ],
              'plain-text'
            );
          } else {
            if (onDiscard) {
              onDiscard(vial.id, reason);
            }
          }
        }
      })),
      { cancelable: true }
    );
  };

  return (
    <View style={[
      styles.container, 
      vial.isActive && styles.activeContainer,
      isExpiringSoon && styles.expiringContainer,
      isExpired && styles.expiredContainer,
      isDiscarded && styles.discardedContainer
    ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.vialName}>{vial.name || `Vial ${vial.id.slice(0, 8)}`}</Text>
          <View style={styles.statusBadge}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {!isDiscarded && (
            <>
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Icon.Edit3 stroke={theme.colors.gray[600]} width={18} height={18} />
              </TouchableOpacity>
              {vial.isActive ? (
                <TouchableOpacity onPress={handleDiscard} style={styles.actionButton}>
                  <Icon.XCircle stroke={theme.colors.warning || '#F59E0B'} width={18} height={18} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                  <Icon.Trash2 stroke={theme.colors.error} width={18} height={18} />
                </TouchableOpacity>
              )}
            </>
          )}
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
        
        {isDiscarded && vial.discardReason && (
          <View style={styles.discardSection}>
            <Text style={styles.discardLabel}>Discard Reason:</Text>
            <Text style={styles.discardText}>{vial.discardReason}</Text>
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
  expiringContainer: {
    borderColor: theme.colors.warning || '#F59E0B',
    borderWidth: 2,
  },
  expiredContainer: {
    borderColor: theme.colors.error,
    borderWidth: 2,
    opacity: 0.8,
  },
  discardedContainer: {
    opacity: 0.6,
    backgroundColor: theme.colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
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
  discardSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  discardLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  discardText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    lineHeight: 20,
  },
});