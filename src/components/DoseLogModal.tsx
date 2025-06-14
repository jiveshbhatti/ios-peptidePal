import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { theme } from '@/constants/theme';
import { Peptide } from '@/types/peptide';
import * as dateUtils from '@/utils/date';
import { calculateRemainingDoses } from '@/utils/dose-calculations';

interface DoseLogModalProps {
  visible: boolean;
  onClose: () => void;
  peptide: Peptide | null;
  date: Date;
  time: 'AM' | 'PM';
  onLog: (dose: { amount: number; unit: string; notes?: string }) => void;
}

export default function DoseLogModal({
  visible,
  onClose,
  peptide,
  date,
  time,
  onLog,
}: DoseLogModalProps) {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [logTime, setLogTime] = useState(new Date());

  // Reset form when peptide changes
  React.useEffect(() => {
    if (peptide) {
      setAmount(peptide.typicalDosageUnits?.toString() || '0');
      setUnit(peptide.dosageUnit || 'mcg');
      const now = new Date();
      now.setHours(time === 'AM' ? 8 : 20, 0, 0, 0);
      setLogTime(now);
    }
  }, [peptide, time]);

  if (!peptide) return null;

  const activeVial = peptide.vials?.find(v => v.isActive);
  const remainingDoses = calculateRemainingDoses(peptide);
  const isLowStock = remainingDoses > 0 && remainingDoses < 3;
  
  // Check if vial is expired
  const isVialExpired = activeVial?.expirationDate 
    ? new Date(activeVial.expirationDate) < new Date() 
    : false;

  const handleLog = () => {
    const doseAmount = parseFloat(amount);
    
    if (isNaN(doseAmount) || doseAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid dose amount');
      return;
    }

    if (!activeVial || remainingDoses === 0) {
      Alert.alert('No Active Vial', 'Please activate a vial from inventory');
      return;
    }
    
    // Allow logging even for expired vials
    // Users may need to log doses for expired vials in certain cases

    // Check if the amount exceeds remaining units, but only if units match
    // If the unit is the same as in vial tracking (which is typically in doses), compare directly
    // For now, allow any amount since peptide tracking is in doses, not mcg
    // This allows logging custom doses like 600mcg even when only 10 doses remain
    
    // Commenting out the validation to allow custom dose amounts
    /*
    if (doseAmount > remainingDoses) {
      Alert.alert(
        'Insufficient Doses',
        `Only ${remainingDoses} doses remaining in the active vial`,
      );
      return;
    }
    */

    const logData: any = {
      amount: doseAmount,
      dosage: doseAmount, // Add dosage field to match DoseLog interface
      unit,
      vialId: activeVial.id, // Track which vial this dose came from
    };
    
    // Only add notes if it has content
    if (notes.trim()) {
      logData.notes = notes.trim();
    }
    
    onLog(logData);

    // Reset form
    setNotes('');
    onClose();
  };

  const handleStepAmount = (direction: 'up' | 'down') => {
    const current = parseFloat(amount) || 0;
    // Use a step size of 25 instead of 1 for better usability
    const step = direction === 'up' ? 25 : -25;
    const newAmount = Math.max(0, current + step);
    setAmount(newAmount.toString());
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Dose</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
            showsVerticalScrollIndicator={true}
          >
            {/* Peptide Info */}
            <View style={styles.peptideInfoContainer}>
              <Text style={styles.peptideName}>{peptide.name}</Text>
              <Text style={styles.peptideSchedule}>
                {time} • {dateUtils.formatDate(date)}
              </Text>
            </View>

            {/* Dose Amount */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Dose Amount</Text>
              <View style={styles.amountContainer}>
                <TouchableOpacity 
                  style={styles.amountButton}
                  onPress={() => handleStepAmount('down')}
                >
                  <Text style={styles.amountButtonText}>–</Text>
                </TouchableOpacity>
                
                <View style={styles.amountDisplay}>
                  <Text style={styles.amountText}>
                    {amount} <Text style={styles.unitText}>{unit}</Text>
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.amountButton}
                  onPress={() => handleStepAmount('up')}
                >
                  <Text style={styles.amountButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Section */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Time</Text>
              <TouchableOpacity 
                style={styles.timeSelector}
                // Removed time picker for now to simplify
              >
                <Text style={styles.timeText}>{time === 'AM' ? '8:00 AM' : '8:00 PM'}</Text>
              </TouchableOpacity>
            </View>

            {/* Notes Section */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this dose..."
                placeholderTextColor={theme.colors.gray[400]}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* Vial Status */}
            {activeVial && (
              <View style={[
                styles.vialStatusContainer, 
                isLowStock && styles.lowStockContainer,
                isVialExpired && styles.expiredContainer
              ]}>
                <Text style={[
                  styles.vialStatusText,
                  isLowStock && styles.lowStockText,
                  isVialExpired && styles.expiredText
                ]}>
                  {isVialExpired
                    ? 'Vial has expired! Please activate a new vial'
                    : isLowStock 
                    ? `Low stock alert: ${remainingDoses} doses remaining` 
                    : `${remainingDoses} doses remaining in active vial`
                  }
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logButton} 
              onPress={handleLog}
              activeOpacity={0.7}
            >
              <Text style={styles.logButtonText}>Log Dose</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    width: 30, 
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.gray[600],
    fontWeight: '400',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  peptideInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  peptideName: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 5,
  },
  peptideSchedule: {
    fontSize: 16,
    color: theme.colors.gray[500],
  },
  inputSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[700],
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  amountButtonText: {
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.gray[700],
  },
  amountDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.gray[800],
  },
  unitText: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  timeSelector: {
    backgroundColor: theme.colors.gray[100],
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  timeText: {
    fontSize: 18,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 16,
    color: theme.colors.gray[800],
    backgroundColor: theme.colors.gray[50],
    textAlignVertical: 'top',
  },
  vialStatusContainer: {
    backgroundColor: theme.colors.primaryLight,
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  lowStockContainer: {
    backgroundColor: '#FEF9C3', // Light yellow
  },
  vialStatusText: {
    fontSize: 14,
    color: theme.colors.gray[700],
    textAlign: 'center',
  },
  lowStockText: {
    color: theme.colors.warning,
    fontWeight: '500',
  },
  expiredContainer: {
    backgroundColor: '#FEE2E2', // Light red
  },
  expiredText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logButton: {
    flex: 1,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});