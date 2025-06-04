import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { AppHaptics } from '@/utils/haptics';
import { Vial } from '@/types/peptide';
import { VialCompletionType, getCompletionTypeDisplay } from '@/types/vial-completion';
import SegmentedControl from '@/components/ui/SegmentedControl';

interface CompleteVialModalProps {
  visible: boolean;
  vial: Vial | null;
  remainingDoses: number;
  onClose: () => void;
  onComplete: (type: VialCompletionType, reason?: string) => Promise<void>;
}

export default function CompleteVialModal({
  visible,
  vial,
  remainingDoses,
  onClose,
  onComplete,
}: CompleteVialModalProps) {
  const [selectedType, setSelectedType] = useState<VialCompletionType>(
    remainingDoses === 0 ? VialCompletionType.FULLY_USED : VialCompletionType.PARTIAL_WASTE
  );
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!vial) return null;

  const completionOptions = remainingDoses === 0
    ? [VialCompletionType.FULLY_USED]
    : [
        VialCompletionType.PARTIAL_WASTE,
        VialCompletionType.EXPIRED,
        VialCompletionType.CONTAMINATED,
        VialCompletionType.DAMAGED,
        VialCompletionType.LOST,
        VialCompletionType.OTHER,
      ];

  const getTypeIcon = (type: VialCompletionType) => {
    switch (type) {
      case VialCompletionType.FULLY_USED:
        return <Icon.CheckCircle stroke={theme.colors.secondary} width={20} height={20} />;
      case VialCompletionType.PARTIAL_WASTE:
        return <Icon.Package stroke={theme.colors.warning} width={20} height={20} />;
      case VialCompletionType.EXPIRED:
        return <Icon.Calendar stroke={theme.colors.error} width={20} height={20} />;
      case VialCompletionType.CONTAMINATED:
        return <Icon.AlertTriangle stroke={theme.colors.error} width={20} height={20} />;
      case VialCompletionType.DAMAGED:
        return <Icon.Tool stroke={theme.colors.error} width={20} height={20} />;
      case VialCompletionType.LOST:
        return <Icon.HelpCircle stroke={theme.colors.gray[600]} width={20} height={20} />;
      case VialCompletionType.OTHER:
        return <Icon.MoreHorizontal stroke={theme.colors.gray[600]} width={20} height={20} />;
      default:
        return null;
    }
  };

  const handleComplete = async () => {
    if (selectedType === VialCompletionType.OTHER && !customReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for completing this vial.');
      return;
    }

    AppHaptics.buttonTap();
    setIsSubmitting(true);

    try {
      await onComplete(
        selectedType,
        selectedType === VialCompletionType.OTHER ? customReason : undefined
      );
      AppHaptics.success();
      onClose();
    } catch (error) {
      AppHaptics.error();
      Alert.alert('Error', 'Failed to complete vial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Vial</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon.X stroke={theme.colors.gray[600]} width={24} height={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Vial Info */}
            <View style={styles.vialInfo}>
              <Text style={styles.vialName}>{vial.name || `Vial ${vial.id.slice(0, 8)}`}</Text>
              {remainingDoses > 0 && (
                <View style={styles.warningBox}>
                  <Icon.AlertCircle stroke={theme.colors.warning} width={20} height={20} />
                  <Text style={styles.warningText}>
                    {remainingDoses} doses remaining will be marked as wasted
                  </Text>
                </View>
              )}
            </View>

            {/* Completion Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Completion</Text>
              <View style={styles.optionsGrid}>
                {completionOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionCard,
                      selectedType === type && styles.selectedOption,
                    ]}
                    onPress={() => {
                      AppHaptics.selection();
                      setSelectedType(type);
                    }}
                  >
                    {getTypeIcon(type)}
                    <Text style={[
                      styles.optionText,
                      selectedType === type && styles.selectedOptionText,
                    ]}>
                      {getCompletionTypeDisplay(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Reason Input */}
            {selectedType === VialCompletionType.OTHER && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Please Specify</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason for completion..."
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Initial Doses:</Text>
                <Text style={styles.summaryValue}>{vial.initialAmountUnits}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doses Used:</Text>
                <Text style={styles.summaryValue}>
                  {vial.initialAmountUnits - remainingDoses}
                </Text>
              </View>
              {remainingDoses > 0 && (
                <View style={[styles.summaryRow, styles.wastedRow]}>
                  <Text style={[styles.summaryLabel, styles.wastedText]}>Doses Wasted:</Text>
                  <Text style={[styles.summaryValue, styles.wastedText]}>
                    {remainingDoses}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={handleComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.completeButtonText}>Completing...</Text>
              ) : (
                <Text style={styles.completeButtonText}>Complete Vial</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[900],
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
  },
  vialInfo: {
    marginBottom: theme.spacing.lg,
  },
  vialName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.background,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[700],
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    minHeight: 80,
  },
  summarySection: {
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  wastedRow: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  wastedText: {
    color: theme.colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
  },
  completeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
});