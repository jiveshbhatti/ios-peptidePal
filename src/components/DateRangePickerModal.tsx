import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../constants/theme';
import { format } from 'date-fns';

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialStartDate = new Date(new Date().setDate(new Date().getDate() - 30)),
  initialEndDate = new Date(),
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [pickingStart, setPickingStart] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      if (pickingStart) {
        setStartDate(selectedDate);
        // Ensure end date is not before start date
        if (selectedDate > endDate) {
          setEndDate(selectedDate);
        }
      } else {
        // Ensure end date is not before start date
        if (selectedDate >= startDate) {
          setEndDate(selectedDate);
        }
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(startDate, endDate);
    onClose();
  };

  const renderDateButton = (label: string, date: Date, isStart: boolean) => (
    <TouchableOpacity
      style={[styles.dateButton, pickingStart === isStart && styles.activeDateButton]}
      onPress={() => {
        setPickingStart(isStart);
        if (Platform.OS === 'android') {
          setShowPicker(true);
        }
      }}
    >
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{format(date, 'MMM d, yyyy')}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            {renderDateButton('Start Date', startDate, true)}
            <Text style={styles.toText}>to</Text>
            {renderDateButton('End Date', endDate, false)}
          </View>

          {(Platform.OS === 'ios' || showPicker) && (
            <DateTimePicker
              value={pickingStart ? startDate : endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={pickingStart ? endDate : new Date()}
              minimumDate={pickingStart ? undefined : startDate}
              style={styles.datePicker}
            />
          )}

          <View style={styles.quickSelections}>
            <Text style={styles.quickSelectTitle}>Quick Select:</Text>
            <View style={styles.quickSelectButtons}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setStartDate(weekAgo);
                  setEndDate(today);
                }}
              >
                <Text style={styles.quickSelectText}>Last Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(today.getMonth() - 1);
                  setStartDate(monthAgo);
                  setEndDate(today);
                }}
              >
                <Text style={styles.quickSelectText}>Last Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const threeMonthsAgo = new Date(today);
                  threeMonthsAgo.setMonth(today.getMonth() - 3);
                  setStartDate(threeMonthsAgo);
                  setEndDate(today);
                }}
              >
                <Text style={styles.quickSelectText}>Last 3 Months</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: theme.colors.gray[500],
  },
  dateContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeDateButton: {
    borderColor: theme.colors.primary,
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  toText: {
    textAlign: 'center',
    color: theme.colors.gray[500],
    marginVertical: 5,
  },
  datePicker: {
    backgroundColor: theme.colors.background,
    marginHorizontal: 20,
  },
  quickSelections: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  quickSelectTitle: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: 10,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickSelectButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  quickSelectText: {
    fontSize: 12,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelText: {
    color: theme.colors.gray[800],
    fontSize: 16,
    fontWeight: '500',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});