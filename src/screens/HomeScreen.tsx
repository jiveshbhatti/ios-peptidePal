import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import Calendar from '@/components/Calendar';
import PeptideCard from '@/components/PeptideCard';
import { Peptide, DoseLog } from '@/types/peptide';
import * as dateUtils from '@/utils/date';
import { peptideService } from '@/services/peptide.service';
import DoseLogModal from '@/components/DoseLogModal';
import BottomSheet from '@/components/ui/BottomSheet';
import SuccessAnimation from '@/components/ui/SuccessAnimation';

export default function HomeScreen() {
  const { peptides, loading, refreshData } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Get peptides scheduled for the selected day
  const getScheduledPeptides = (): Array<{ peptide: Peptide; time: 'AM' | 'PM' }> => {
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek];
    
    console.log(`Selected date: ${selectedDate.toISOString()}, day of week: ${dayOfWeek}, current day: ${currentDay}`);

    // Debug: Log all peptides to see what's available before filtering
    // All debug code removed

    const scheduled: Array<{ peptide: Peptide; time: 'AM' | 'PM' }> = [];

    peptides.forEach(peptide => {
      if (!peptide.schedule) return;

      // Check if peptide has an active vial with remaining doses
      const activeVial = peptide.vials?.find(v => v.isActive);
      if (!activeVial || activeVial.remainingAmountUnits <= 0) {
        console.log(`Skipping ${peptide.name}: activeVial=${!!activeVial}, remainingDoses=${activeVial?.remainingAmountUnits}`);
        return; // Skip peptides with no active vial or empty vials
      }

      const { frequency, daysOfWeek, times } = peptide.schedule;
      
      // Check if peptide is scheduled for this day
      let isScheduledToday = false;
      if (frequency === 'daily') {
        isScheduledToday = true;
      } else if (frequency === 'specific_days' && daysOfWeek) {
        // Handle both string day names and numeric day indexes
        if (typeof daysOfWeek[0] === 'number') {
          // If daysOfWeek contains numbers (0-6), compare with the numeric day index
          isScheduledToday = daysOfWeek.includes(dayOfWeek);
        } else {
          // If daysOfWeek contains strings ('monday', etc.), compare with the day name
          isScheduledToday = daysOfWeek.includes(currentDay);
        }
      }
      
      console.log(`Peptide ${peptide.name}: frequency=${frequency}, isScheduledToday=${isScheduledToday}, daysOfWeek=${JSON.stringify(daysOfWeek)}, currentDay=${currentDay}, dayOfWeek=${dayOfWeek}`);

      if (isScheduledToday && times) {
        times.forEach(time => {
          scheduled.push({ peptide, time: time as 'AM' | 'PM' });
        });
      }
    });

    return scheduled;
  };

  // Check if a dose is logged for a specific peptide and time
  const isDoseLogged = (peptideId: string, time: 'AM' | 'PM'): boolean => {
    const peptide = peptides.find(p => p.id === peptideId);
    if (!peptide || !peptide.doseLogs) return false;

    return peptide.doseLogs.some(log => {
      // Handle both date and loggedAt field names for backward compatibility
      const logDate = log.date || log.loggedAt;
      return logDate && dateUtils.isSameDay(new Date(logDate), selectedDate) && 
        log.timeOfDay === time;
    });
  };

  // Find dose log ID for a specific peptide, date, and time
  const findDoseLogId = (peptideId: string, time: 'AM' | 'PM'): string | null => {
    const peptide = peptides.find(p => p.id === peptideId);
    if (!peptide || !peptide.doseLogs) return null;

    const doseLog = peptide.doseLogs.find(log => {
      // Handle both date and loggedAt field names for backward compatibility
      const logDate = log.date || log.loggedAt;
      return logDate && dateUtils.isSameDay(new Date(logDate), selectedDate) && 
        log.timeOfDay === time;
    });

    return doseLog ? doseLog.id : null;
  };

  // Get dates with scheduled peptides for calendar markers
  const getMarkedDates = (): Date[] => {
    const marked: Date[] = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3); // Look 3 months ahead

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const daySchedule = getScheduledPeptidesForDate(new Date(d));
      if (daySchedule.length > 0) {
        marked.push(new Date(d));
      }
    }

    return marked;
  };

  const getScheduledPeptidesForDate = (date: Date): Array<{ peptide: Peptide; time: 'AM' | 'PM' }> => {
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek];

    const scheduled: Array<{ peptide: Peptide; time: 'AM' | 'PM' }> = [];

    peptides.forEach(peptide => {
      if (!peptide.schedule) return;

      // Check if peptide has an active vial with remaining doses
      const activeVial = peptide.vials?.find(v => v.isActive);
      if (!activeVial || activeVial.remainingAmountUnits <= 0) {
        return; // Skip peptides with no active vial or empty vials
      }

      const { frequency, daysOfWeek, times } = peptide.schedule;
      
      let isScheduledToday = false;
      if (frequency === 'daily') {
        isScheduledToday = true;
      } else if (frequency === 'specific_days' && daysOfWeek) {
        // Handle both string day names and numeric day indexes
        if (typeof daysOfWeek[0] === 'number') {
          // If daysOfWeek contains numbers (0-6), compare with the numeric day index
          isScheduledToday = daysOfWeek.includes(dayOfWeek);
        } else {
          // If daysOfWeek contains strings ('monday', etc.), compare with the day name
          isScheduledToday = daysOfWeek.includes(currentDay);
        }
      }

      if (isScheduledToday && times) {
        times.forEach(time => {
          scheduled.push({ peptide, time: time as 'AM' | 'PM' });
        });
      }
    });

    return scheduled;
  };

  const [selectedPeptide, setSelectedPeptide] = useState<Peptide | null>(null);
  const [selectedTime, setSelectedTime] = useState<'AM' | 'PM'>('AM');
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Dose logged successfully!');

  const handleLogDose = async (peptideId: string, time: 'AM' | 'PM') => {
    // Check if dose is already logged for this time
    if (isDoseLogged(peptideId, time)) {
      // Show a message that dose is already logged
      Alert.alert(
        "Already Logged",
        "You've already logged this dose for today.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const peptide = peptides.find(p => p.id === peptideId);
    if (!peptide) return;
    
    // Make sure we have the latest peptide data before showing the modal
    const refreshedPeptides = await peptideService.getPeptides();
    const refreshedPeptide = refreshedPeptides.find(p => p.id === peptideId);
    
    setSelectedPeptide(refreshedPeptide || peptide);
    setSelectedTime(time);
    setShowDoseModal(true);
  };

  const handlePeptidePress = (peptideId: string) => {
    // TODO: Navigate to peptide details
    console.log('Navigate to peptide:', peptideId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const scheduledPeptides = getScheduledPeptides();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        markedDates={getMarkedDates()}
      />

      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleTitle}>
          Today's Schedule
        </Text>

        {scheduledPeptides.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No peptides scheduled for this day</Text>
          </View>
        ) : (
          scheduledPeptides.map(({ peptide, time }) => (
            <PeptideCard
              key={`${peptide.id}-${time}`}
              peptide={peptide}
              scheduleTime={time}
              isLogged={isDoseLogged(peptide.id, time)}
              onLog={() => handleLogDose(peptide.id, time)}
              onPress={() => handlePeptidePress(peptide.id)}
            />
          ))
        )}
      </View>

      <DoseLogModal
        visible={showDoseModal}
        onClose={() => setShowDoseModal(false)}
        peptide={selectedPeptide}
        date={selectedDate}
        time={selectedTime}
        onLog={async (dose) => {
          if (!selectedPeptide) return;
          
          await peptideService.addDoseLog(selectedPeptide.id, {
            amount: dose.amount,
            unit: dose.unit,
            date: selectedDate.toISOString(), // Use the date field from the schema
            timeOfDay: selectedTime,
            notes: dose.notes,
          });
          
          // Close the modal and show success animation
          setShowDoseModal(false);
          setSuccessMessage(`${selectedPeptide.name} dose logged successfully!`);
          setShowSuccessAnimation(true);
          
          // Refresh data in background
          await refreshData();
        }}
      />

      {/* Success Animation */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        message={successMessage}
        onComplete={() => setShowSuccessAnimation(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleSection: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  scheduleTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[500],
  },
});