import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '@/constants/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import * as Icon from 'react-native-feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { WeightEntry, BodyMeasurement } from '@/types/metrics';
import { AppHaptics } from '@/utils/haptics';
import { userProfileService } from '@/services/user-profile.service';

interface AddMetricModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'weight' | 'measurement';
  onSuccess: () => void;
}

export default function AddMetricModal({ visible, onClose, type, onSuccess }: AddMetricModalProps) {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Weight fields
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  
  // Measurement fields
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    bicepLeft: '',
    bicepRight: '',
    thighLeft: '',
    thighRight: '',
    neck: '',
    shoulders: '',
    calfLeft: '',
    calfRight: '',
  });
  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in');
  
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (type === 'weight' && !weight) {
      Alert.alert('Error', 'Please enter your weight');
      return;
    }

    if (type === 'measurement') {
      const hasAnyMeasurement = Object.values(measurements).some(v => v !== '');
      if (!hasAnyMeasurement) {
        Alert.alert('Error', 'Please enter at least one measurement');
        return;
      }
    }

    setSaving(true);

    try {
      if (type === 'weight') {
        await userProfileService.addWeightEntry({
          date: date.toISOString(),
          weight: parseFloat(weight),
          unit: weightUnit,
          notes: notes.trim() || undefined,
        });
      } else {
        const measurementData: any = {};
        Object.entries(measurements).forEach(([key, value]) => {
          if (value) {
            measurementData[key] = parseFloat(value);
          }
        });
        
        await userProfileService.addBodyMeasurement({
          date: date.toISOString(),
          ...measurementData,
          unit: measurementUnit,
          notes: notes.trim() || undefined,
        });
      }

      AppHaptics.success();
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setWeight('');
    setMeasurements({
      chest: '',
      waist: '',
      hips: '',
      bicepLeft: '',
      bicepRight: '',
      thighLeft: '',
      thighRight: '',
      neck: '',
      shoulders: '',
      calfLeft: '',
      calfRight: '',
    });
    setNotes('');
  };

  const renderWeightForm = () => (
    <>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight</Text>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>
        
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('lbs')}
          >
            <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('kg')}
          >
            <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderMeasurementForm = () => (
    <>
      <View style={styles.unitToggleContainer}>
        <Text style={styles.label}>Unit</Text>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, measurementUnit === 'in' && styles.unitButtonActive]}
            onPress={() => setMeasurementUnit('in')}
          >
            <Text style={[styles.unitText, measurementUnit === 'in' && styles.unitTextActive]}>in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, measurementUnit === 'cm' && styles.unitButtonActive]}
            onPress={() => setMeasurementUnit('cm')}
          >
            <Text style={[styles.unitText, measurementUnit === 'cm' && styles.unitTextActive]}>cm</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.measurementGrid}>
        {Object.entries(measurements).map(([key, value]) => (
          <View key={key} style={styles.measurementInput}>
            <Text style={styles.measurementLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
            <TextInput
              style={styles.smallInput}
              placeholder="0.0"
              value={value}
              onChangeText={(text) => setMeasurements(prev => ({ ...prev, [key]: text }))}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.gray[400]}
            />
          </View>
        ))}
      </View>
    </>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} height={type === 'weight' ? 400 : 600}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Text style={styles.title}>
              {type === 'weight' ? 'Log Weight' : 'Add Measurements'}
            </Text>

            {/* Date Picker */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon.Calendar color={theme.colors.gray[600]} width={20} height={20} />
              <Text style={styles.dateText}>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'android');
                  if (selectedDate) setDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}

            {/* Form Fields */}
            {type === 'weight' ? renderWeightForm() : renderMeasurementForm()}

            {/* Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.gray[400]}
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.lg,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  dateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  unitButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md - 2,
  },
  unitButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  unitText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[600],
  },
  unitTextActive: {
    color: 'white',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  measurementInput: {
    width: '47%',
  },
  measurementLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.xs,
  },
  smallInput: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
  },
  notesContainer: {
    marginBottom: theme.spacing.lg,
  },
  notesInput: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});