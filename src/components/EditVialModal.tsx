import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Vial } from '@/types/peptide';
import { AppHaptics } from '@/utils/haptics';

interface EditVialModalProps {
  visible: boolean;
  vial: Vial | null;
  onClose: () => void;
  onSave: (vialId: string, updates: Partial<Vial>) => void;
  onRecalculate?: (vialId: string, newTotalMcg: number, newBacWaterMl: number) => void;
}

export default function EditVialModal({ visible, vial, onClose, onSave, onRecalculate }: EditVialModalProps) {
  const [reconstitutionBacWaterMl, setReconstitutionBacWaterMl] = useState('');
  const [notes, setNotes] = useState('');
  const [totalPeptideInVialMcg, setTotalPeptideInVialMcg] = useState('');
  const [showRecalculation, setShowRecalculation] = useState(false);

  useEffect(() => {
    if (vial) {
      setReconstitutionBacWaterMl(vial.reconstitutionBacWaterMl?.toString() || '');
      setNotes(vial.notes || '');
      setTotalPeptideInVialMcg(vial.totalPeptideInVialMcg?.toString() || '');
    }
  }, [vial]);

  const handleSave = () => {
    if (!vial) return;

    const updates: Partial<Vial> = {
      reconstitutionBacWaterMl: parseFloat(reconstitutionBacWaterMl) || vial.reconstitutionBacWaterMl,
      notes: notes,
    };

    if (totalPeptideInVialMcg && parseFloat(totalPeptideInVialMcg) !== vial.totalPeptideInVialMcg) {
      updates.totalPeptideInVialMcg = parseFloat(totalPeptideInVialMcg);
    }

    onSave(vial.id, updates);
    onClose();
  };

  const handleRecalculate = () => {
    if (!vial) return;

    Alert.alert(
      'Recalculate Doses',
      'This will recalculate the remaining doses based on the new vial strength and BAC water amount. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalculate',
          onPress: () => {
            if (onRecalculate) {
              onRecalculate(
                vial.id,
                parseFloat(totalPeptideInVialMcg) || vial.totalPeptideInVialMcg || 0,
                parseFloat(reconstitutionBacWaterMl) || vial.reconstitutionBacWaterMl || 2
              );
            }
            setShowRecalculation(false);
            onClose();
          }
        }
      ]
    );
  };

  if (!vial) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Vial</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon.X stroke={theme.colors.gray[600]} width={24} height={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>BAC Water Amount (mL)</Text>
                <TextInput
                  style={styles.input}
                  value={reconstitutionBacWaterMl}
                  onChangeText={setReconstitutionBacWaterMl}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 2"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Total Peptide in Vial (mcg)</Text>
                <TextInput
                  style={styles.input}
                  value={totalPeptideInVialMcg}
                  onChangeText={setTotalPeptideInVialMcg}
                  keyboardType="numeric"
                  placeholder="e.g., 5000"
                />
                <Text style={styles.helpText}>
                  Current: {vial.totalPeptideInVialMcg || 'Not set'} mcg
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Add any notes about this vial..."
                />
              </View>

              {(parseFloat(totalPeptideInVialMcg) !== vial.totalPeptideInVialMcg || 
                parseFloat(reconstitutionBacWaterMl) !== vial.reconstitutionBacWaterMl) && (
                <TouchableOpacity 
                  style={styles.recalculateButton}
                  onPress={() => setShowRecalculation(true)}
                >
                  <Icon.RefreshCw stroke={theme.colors.primary} width={18} height={18} />
                  <Text style={styles.recalculateText}>Recalculate Doses</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {showRecalculation && (
        <Modal
          visible={showRecalculation}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.recalcModal}>
            <View style={styles.recalcContent}>
              <Text style={styles.recalcTitle}>Dose Recalculation</Text>
              <Text style={styles.recalcText}>
                New concentration will be:{'\n'}
                {(parseFloat(totalPeptideInVialMcg) / parseFloat(reconstitutionBacWaterMl)).toFixed(0)} mcg/mL
              </Text>
              <View style={styles.recalcButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowRecalculation(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleRecalculate}
                >
                  <Text style={styles.saveButtonText}>Recalculate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  form: {
    padding: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  recalculateText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[100],
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.gray[700],
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
  recalcModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.lg,
  },
  recalcContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  recalcTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  recalcText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  recalcButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});