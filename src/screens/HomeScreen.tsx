import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
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

export default function HomeScreen() {
  const { peptides, loading, refreshData } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Get peptides scheduled for the selected day
  const getScheduledPeptides = (): Array<{ peptide: Peptide; time: 'AM' | 'PM' }> => {
    const dayOfWeek = selectedDate.getDay();
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
      
      // Check if peptide is scheduled for this day
      let isScheduledToday = false;
      if (frequency === 'daily') {
        isScheduledToday = true;
      } else if (frequency === 'specific_days' && daysOfWeek?.includes(currentDay)) {
        isScheduledToday = true;
      }

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

    return peptide.doseLogs.some(log => 
      dateUtils.isSameDay(new Date(log.loggedAt), selectedDate) &&
      log.timeOfDay === time
    );
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
      } else if (frequency === 'specific_days' && daysOfWeek?.includes(currentDay)) {
        isScheduledToday = true;
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

  const handleLogDose = async (peptideId: string, time: 'AM' | 'PM') => {
    const peptide = peptides.find(p => p.id === peptideId);
    if (!peptide) return;
    
    setSelectedPeptide(peptide);
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
            loggedAt: selectedDate.toISOString(),
            timeOfDay: selectedTime,
            notes: dose.notes,
          });
          
          await refreshData();
          setShowDoseModal(false);
        }}
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
    fontSize: 28,
    fontWeight: '700',
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