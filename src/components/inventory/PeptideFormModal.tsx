import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/constants/theme';
import { InventoryPeptide } from '@/types/inventory';
import BottomSheet from '@/components/ui/BottomSheet';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { inventoryService } from '@/services/inventory.service';

interface PeptideFormModalProps {
  visible: boolean;
  onClose: () => void;
  peptide?: InventoryPeptide; // For editing
  onSave: () => void;
}

export default function PeptideFormModal({
  visible,
  onClose,
  peptide,
  onSave,
}: PeptideFormModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [numVials, setNumVials] = useState('');
  const [concentration, setConcentration] = useState('');
  const [typicalDose, setTypicalDose] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryDateObj, setExpiryDateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bacWaterVolume, setBacWaterVolume] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  
  // Schedule state
  const [strength, setStrength] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mcg');
  const [frequency, setFrequency] = useState('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [timeAM, setTimeAM] = useState(true);
  const [timePM, setTimePM] = useState(false);
  const [notes, setNotes] = useState('');

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState(0); // 0: Inventory, 1: Schedule

  // Fill form with peptide data when editing
  useEffect(() => {
    if (peptide) {
      setName(peptide.name || '');
      setNumVials(peptide.num_vials?.toString() || '');
      setConcentration(peptide.concentration_per_vial_mcg?.toString() || '');
      setTypicalDose(peptide.typical_dose_mcg?.toString() || '');
      setStorageLocation(peptide.storage_location || '');
      setBatchNumber(peptide.batch_number || '');
      setBacWaterVolume(peptide.bac_water_volume_added?.toString() || '');
      setLowStockThreshold(peptide.low_stock_threshold?.toString() || '');
      
      // Handle expiry date
      if (peptide.expiry_date) {
        const date = new Date(peptide.expiry_date);
        setExpiryDateObj(date);
        setExpiryDate(formatDate(date));
      }
      
      // TODO: Fetch schedule data from peptide
      // Would retrieve the corresponding Peptide object and set schedule state
    }
  }, [peptide]);
  
  // Format date as MM/DD/YYYY
  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  // Handle date change from picker
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiryDateObj(selectedDate);
      setExpiryDate(formatDate(selectedDate));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!numVials.trim() || isNaN(Number(numVials)) || Number(numVials) < 0) {
      newErrors.numVials = 'Valid number of vials is required';
    }
    
    if (!concentration.trim() || isNaN(Number(concentration)) || Number(concentration) <= 0) {
      newErrors.concentration = 'Valid concentration is required';
    }
    
    if (!typicalDose.trim() || isNaN(Number(typicalDose)) || Number(typicalDose) <= 0) {
      newErrors.typicalDose = 'Valid typical dose is required';
    }
    
    if (!strength.trim()) {
      newErrors.strength = 'Strength is required';
    }
    
    if (frequency === 'specific_days' && daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Select at least one day';
    }
    
    if (!timeAM && !timePM) {
      newErrors.times = 'Select at least one time (AM/PM)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Show tab with errors
      if (Object.keys(errors).some(key => 
        ['name', 'numVials', 'concentration', 'typicalDose'].includes(key)
      )) {
        setTab(0);
      } else {
        setTab(1);
      }
      return;
    }

    try {
      // Prepare inventory data
      const inventoryData = {
        name,
        num_vials: Number(numVials),
        concentration_per_vial_mcg: Number(concentration),
        typical_dose_mcg: Number(typicalDose),
        storage_location: storageLocation,
        batch_number: batchNumber,
        expiry_date: expiryDateObj ? expiryDateObj.toISOString() : null,
        bac_water_volume_added: bacWaterVolume ? Number(bacWaterVolume) : null,
        low_stock_threshold: lowStockThreshold ? Number(lowStockThreshold) : undefined,
        active_vial_status: 'NONE',
      };

      // Prepare schedule data
      const scheduleData = {
        schedule: {
          frequency,
          daysOfWeek: frequency === 'specific_days' ? daysOfWeek : undefined,
          times: [
            ...(timeAM ? ['AM'] : []),
            ...(timePM ? ['PM'] : []),
          ],
        },
        strength,
        typicalDosageUnits: Number(typicalDose),
        dosageUnit,
        notes,
      };

      if (peptide) {
        // Update existing peptide
        await inventoryService.updatePeptideInInventory(
          peptide.id,
          inventoryData,
          scheduleData
        );
      } else {
        // Add new peptide
        await inventoryService.addPeptideToInventory(
          inventoryData,
          scheduleData
        );
      }

      onSave();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving peptide:', error);
      Alert.alert('Error', 'Failed to save peptide to inventory');
    }
  };

  const resetForm = () => {
    setName('');
    setNumVials('');
    setConcentration('');
    setTypicalDose('');
    setStorageLocation('');
    setBatchNumber('');
    setExpiryDate('');
    setLowStockThreshold('');
    setStrength('');
    setDosageUnit('mcg');
    setFrequency('daily');
    setDaysOfWeek([]);
    setTimeAM(true);
    setTimePM(false);
    setNotes('');
    setErrors({});
  };

  const handleDayToggle = (day: string) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={peptide ? 'Edit Peptide' : 'Add Peptide'}
      height="90%"
    >
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 0 && styles.activeTab]}
            onPress={() => setTab(0)}
          >
            <Text style={[styles.tabText, tab === 0 && styles.activeTabText]}>
              Inventory
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 1 && styles.activeTab]}
            onPress={() => setTab(1)}
          >
            <Text style={[styles.tabText, tab === 1 && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {tab === 0 ? (
            // Inventory Tab
            <View>
              <Input
                label="Peptide Name"
                value={name}
                onChangeText={setName}
                placeholder="E.g., BPC-157"
                error={errors.name}
              />
              
              <Input
                label="Number of Vials"
                value={numVials}
                onChangeText={setNumVials}
                placeholder="E.g., 5"
                keyboardType="numeric"
                error={errors.numVials}
              />
              
              <Input
                label="Concentration per Vial (mcg)"
                value={concentration}
                onChangeText={setConcentration}
                placeholder="E.g., 5000"
                keyboardType="numeric"
                error={errors.concentration}
              />
              
              <Input
                label="Typical Dose from This Vial (mcg)"
                value={typicalDose}
                onChangeText={setTypicalDose}
                placeholder="E.g., 250"
                keyboardType="numeric"
                error={errors.typicalDose}
              />
              
              <Input
                label="Storage Location (optional)"
                value={storageLocation}
                onChangeText={setStorageLocation}
                placeholder="E.g., Refrigerator"
              />
              
              <Input
                label="Batch Number (optional)"
                value={batchNumber}
                onChangeText={setBatchNumber}
                placeholder="E.g., LOT123456"
              />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stock Expiry Date (optional)</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {expiryDate || 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={expiryDateObj || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              <Input
                label="BAC Water Volume (ml)"
                value={bacWaterVolume}
                onChangeText={setBacWaterVolume}
                placeholder="E.g., 2"
                keyboardType="numeric"
              />
              
              <Input
                label="Low Stock Threshold (optional)"
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                placeholder="E.g., 2"
                keyboardType="numeric"
              />
            </View>
          ) : (
            // Schedule Tab
            <View>
              <Input
                label="Strength (for display)"
                value={strength}
                onChangeText={setStrength}
                placeholder="E.g., 5mg/vial"
                error={errors.strength}
              />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dosage Unit</Text>
                <View style={styles.buttonGroup}>
                  {['mcg', 'mg', 'IU'].map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        dosageUnit === unit && styles.selectedUnitButton,
                      ]}
                      onPress={() => setDosageUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          dosageUnit === unit && styles.selectedUnitButtonText,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Frequency</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      frequency === 'daily' && styles.selectedFrequencyButton,
                    ]}
                    onPress={() => setFrequency('daily')}
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
                    onPress={() => setFrequency('specific_days')}
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
                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          daysOfWeek.includes(day) && styles.selectedDayButton,
                        ]}
                        onPress={() => handleDayToggle(day)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            daysOfWeek.includes(day) && styles.selectedDayButtonText,
                          ]}
                        >
                          {day.charAt(0).toUpperCase()}
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
                      onValueChange={setTimeAM}
                      trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                    />
                  </View>
                  
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>PM</Text>
                    <Switch
                      value={timePM}
                      onValueChange={setTimePM}
                      trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                    />
                  </View>
                </View>
              </View>
              
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional information..."
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Save"
            onPress={handleSave}
            style={styles.button}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
    fontWeight: '400',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  unitButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  selectedUnitButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unitButtonText: {
    color: theme.colors.gray[700],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  selectedUnitButtonText: {
    color: theme.colors.background,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  selectedFrequencyButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyButtonText: {
    color: theme.colors.gray[700],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  selectedFrequencyButtonText: {
    color: theme.colors.background,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
  },
  selectedDayButton: {
    backgroundColor: theme.colors.primary,
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[700],
  },
  selectedDayButtonText: {
    color: theme.colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  switchLabel: {
    marginRight: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  datePickerButton: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    height: 44,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  datePickerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
});