import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Input from './ui/Input';
import { theme } from '../constants/theme';
import { Peptide, PeptideSchedule } from '../types/peptide';
import { firebaseCleanService } from '../services/firebase-clean';
import { AppHaptics } from '../utils/haptics';

interface EditScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  peptide: Peptide;
  onUpdate?: () => void;
}

export function EditScheduleModal({
  visible,
  onClose,
  peptide,
  onUpdate,
}: EditScheduleModalProps) {
  
  // Schedule state
  const [frequency, setFrequency] = useState<'daily' | 'specific_days'>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [timeAM, setTimeAM] = useState(true);
  const [timePM, setTimePM] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

  // Initialize state from peptide schedule
  useEffect(() => {
    if (peptide?.schedule) {
      setFrequency(peptide.schedule.frequency || 'daily');
      
      // Normalize daysOfWeek to ensure it's always an array of numbers
      const normalizedDays = normalizeDaysOfWeek(peptide.schedule.daysOfWeek);
      setDaysOfWeek(normalizedDays);
      
      setTimeAM(peptide.schedule.times?.includes('AM') || false);
      setTimePM(peptide.schedule.times?.includes('PM') || false);
      setNotes(peptide.notes || '');
    }
  }, [peptide]);

  const handleDayToggle = (dayIndex: number) => {
    AppHaptics.selection();
    if (daysOfWeek.includes(dayIndex)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== dayIndex));
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (frequency === 'specific_days' && daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Select at least one day';
    }

    if (!timeAM && !timePM) {
      newErrors.times = 'Select at least one time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      AppHaptics.warning();
      return;
    }

    setSaving(true);
    try {
      // Build the updated schedule
      const times: string[] = [];
      if (timeAM) times.push('AM');
      if (timePM) times.push('PM');

      const updatedSchedule: PeptideSchedule = {
        frequency,
        daysOfWeek: frequency === 'specific_days' ? daysOfWeek : undefined,
        times,
      };

      // Update only the schedule and notes
      await firebaseCleanService.updatePeptide(peptide.id, {
        schedule: updatedSchedule,
        notes: notes || undefined,
      });

      AppHaptics.success();
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      AppHaptics.error();
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Schedule"
      height="70%"
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedule Frequency</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'daily' && styles.selectedFrequencyButton,
                ]}
                onPress={() => {
                  AppHaptics.selection();
                  setFrequency('daily');
                }}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === 'daily' && styles.selectedFrequencyButtonText,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'specific_days' && styles.selectedFrequencyButton,
                ]}
                onPress={() => {
                  AppHaptics.selection();
                  setFrequency('specific_days');
                }}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === 'specific_days' && styles.selectedFrequencyButtonText,
                  ]}
                >
                  Specific Days
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {frequency === 'specific_days' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Days of Week
                {errors.daysOfWeek ? (
                  <Text style={styles.errorText}> ({errors.daysOfWeek})</Text>
                ) : null}
              </Text>
              <View style={styles.daysContainer}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLetter, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      daysOfWeek.includes(index) && styles.selectedDayButton,
                    ]}
                    onPress={() => handleDayToggle(index)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        daysOfWeek.includes(index) && styles.selectedDayButtonText,
                      ]}
                    >
                      {dayLetter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Time of Day
              {errors.times ? (
                <Text style={styles.errorText}> ({errors.times})</Text>
              ) : null}
            </Text>
            <View style={styles.switchRow}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>AM</Text>
                <Switch
                  value={timeAM}
                  onValueChange={(value) => {
                    AppHaptics.selection();
                    setTimeAM(value);
                  }}
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                />
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>PM</Text>
                <Switch
                  value={timePM}
                  onValueChange={(value) => {
                    AppHaptics.selection();
                    setTimePM(value);
                  }}
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                />
              </View>
            </View>
          </View>
          
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any schedule-specific notes..."
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Save Changes"
            onPress={handleSave}
            style={styles.button}
            loading={saving}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
    fontWeight: '400',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  selectedFrequencyButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    fontWeight: '500',
  },
  selectedFrequencyButtonText: {
    color: theme.colors.white,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[700],
    fontWeight: '600',
  },
  selectedDayButtonText: {
    color: theme.colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  button: {
    flex: 1,
  },
});