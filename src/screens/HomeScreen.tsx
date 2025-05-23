import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { theme } from '@/constants/theme';
import { useData } from '@/contexts/DataContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { HorizontalWeekCalendar } from '@/components/HorizontalWeekCalendar';
import SwipeablePeptideCard from '@/components/SwipeablePeptideCard';
import { Peptide, DoseLog } from '@/types/peptide';
import { AppHaptics } from '@/utils/haptics';
import * as dateUtils from '@/utils/date';
import DoseLogModal from '@/components/DoseLogModal';
import BottomSheet from '@/components/ui/BottomSheet';
import SuccessAnimation from '@/components/ui/SuccessAnimation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { peptides, inventoryPeptides, loading, refreshData } = useData();
  const { service } = useDatabase();
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
      if (!logDate) return false;
      
      // Compare dates and times - ensure we're checking the right fields
      const logDateObj = new Date(logDate);
      const isSameDay = dateUtils.isSameDay(logDateObj, selectedDate);
      const isSameTime = log.timeOfDay === time;
      
      return isSameDay && isSameTime;
    });
  };

  // Find dose log for a specific peptide, date, and time
  // This method now returns the actual dose log object for more flexibility
  const findDoseLog = (peptideId: string, time: 'AM' | 'PM'): DoseLog | null => {
    const peptide = peptides.find(p => p.id === peptideId);
    if (!peptide || !peptide.doseLogs) {
      console.log(`findDoseLog: No peptide or doseLogs for ${peptideId}`);
      return null;
    }

    console.log(`findDoseLog: Searching for dose log on ${selectedDate.toISOString()} ${time}`);
    console.log(`findDoseLog: Available dose logs:`, peptide.doseLogs.map(log => ({
      id: log.id,
      date: log.date || log.loggedAt,
      timeOfDay: log.timeOfDay,
      peptideId: peptideId
    })));

    const doseLog = peptide.doseLogs.find(log => {
      // Handle both date and loggedAt field names for backward compatibility
      const logDate = log.date || log.loggedAt;
      if (!logDate) return false;
      
      // Compare dates and times
      const logDateObj = new Date(logDate);
      const isSameDay = dateUtils.isSameDay(logDateObj, selectedDate);
      const isSameTime = log.timeOfDay === time;
      
      return isSameDay && isSameTime;
    });

    console.log(`findDoseLog: Found dose log:`, doseLog ? doseLog.id : 'none');
    return doseLog || null;
  };

  // Helper to get dose log ID
  const findDoseLogId = (peptideId: string, time: 'AM' | 'PM'): string | null => {
    const doseLog = findDoseLog(peptideId, time);
    return doseLog ? doseLog.id : null;
  };

  // Get dates with scheduled peptides for calendar markers
  const getMarkedDates = (): { [date: string]: { marked: boolean; dotColor?: string } } => {
    const marked: { [date: string]: { marked: boolean; dotColor?: string } } = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30); // Look 30 days back
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30); // Look 30 days ahead

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const daySchedule = getScheduledPeptidesForDate(new Date(d));
      if (daySchedule.length > 0) {
        const dateString = dateUtils.formatDate(new Date(d), 'yyyy-MM-dd');
        marked[dateString] = { 
          marked: true, 
          dotColor: theme.colors.primary 
        };
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

  // Handle reverting a logged dose
  const handleRevertDose = async (peptideId: string, time: 'AM' | 'PM') => {
    // Find the dose log using the enhanced method
    const doseLog = findDoseLog(peptideId, time);
    if (!doseLog || !doseLog.id) {
      console.error(`Cannot find dose log for peptide ${peptideId} at ${selectedDate.toISOString()} ${time}`);
      Alert.alert('Error', 'Could not find the dose log to revert');
      return;
    }
    
    const doseLogId = doseLog.id;
    console.log(`Attempting to revert dose log ${doseLogId} for peptide ${peptideId}`);

    // Ask for confirmation
    Alert.alert(
      'Revert Dose Log',
      'Are you sure you want to remove this logged dose?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Revert',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use Firebase service from context
              console.log("Using Firebase service for dose removal");
              if (service.removeDoseLog) {
                await service.removeDoseLog(peptideId, doseLogId);
              } else {
                throw new Error('Firebase service does not support dose log removal');
              }
              
              // Show success message
              setSuccessMessage('Dose log successfully reverted');
              setShowSuccessAnimation(true);
              
              // Refresh data
              await refreshData();
            } catch (error) {
              console.error('Error reverting dose log:', error);
              Alert.alert('Error', 'Failed to revert dose log');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

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
    
    setSelectedPeptide(peptide);
    setSelectedTime(time);
    setShowDoseModal(true);
  };

  const handlePeptidePress = (peptideId: string) => {
    navigation.navigate('PeptideDetails', { peptideId });
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
      
      <HorizontalWeekCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        markedDates={getMarkedDates()}
      />

      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleTitle}>
          {dateUtils.isToday(selectedDate) 
            ? "Today's Schedule" 
            : `Schedule for ${dateUtils.formatDate(selectedDate, 'MMM d')}`}
        </Text>

        {scheduledPeptides.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No peptides scheduled for this day</Text>
            <Text style={styles.emptySubtext}>
              Activate peptides from your inventory to see them here
            </Text>
          </View>
        ) : (
          scheduledPeptides.map(({ peptide, time }) => {
            const inventoryPeptide = inventoryPeptides.find(ip => ip.id === peptide.id);
            return (
              <SwipeablePeptideCard
                key={`${peptide.id}-${time}`}
                peptide={peptide}
                inventoryPeptide={inventoryPeptide}
                scheduleTime={time}
                isLogged={isDoseLogged(peptide.id, time)}
                onLog={() => handleLogDose(peptide.id, time)}
                onRevert={() => handleRevertDose(peptide.id, time)}
                onPress={() => handlePeptidePress(peptide.id)}
              />
            );
          })
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
          
          try {
            const doseData = {
              dosage: dose.amount, // Use dosage field as per the DoseLog interface
              amount: dose.amount, // Keep amount for backward compatibility
              unit: dose.unit,
              date: selectedDate.toISOString(), // Use the date field from the schema
              timeOfDay: selectedTime,
              notes: dose.notes,
              peptideId: selectedPeptide.id, // Include peptideId for better tracking
            };
            
            // Use Firebase service from context
            console.log("Using Firebase service for dose logging");
            const updatedPeptide = await service.addDoseLog(selectedPeptide.id, doseData);
            
            // Close the modal and show success animation
            setShowDoseModal(false);
            setSuccessMessage(`${selectedPeptide.name} dose logged successfully!`);
            setShowSuccessAnimation(true);
            
            // Check if vial was depleted
            if (updatedPeptide) {
              const activeVial = updatedPeptide.vials?.find(v => v.isActive);
              if (!activeVial || activeVial.remainingAmountUnits <= 0) {
                // Vial is depleted, show prompt to activate new one
                setTimeout(() => {
                  Alert.alert(
                    'Vial Depleted',
                    `The active vial for ${selectedPeptide.name} is now empty.`,
                    [
                      {
                        text: 'Later',
                        style: 'cancel',
                      },
                      {
                        text: 'Go to Inventory',
                        onPress: () => {
                          // Navigate to inventory tab
                          navigation.navigate('Main', { 
                            screen: 'Inventory' 
                          });
                        },
                      },
                    ]
                  );
                }, 1000); // Delay to let success animation show first
              }
            }
            
          } catch (error) {
            console.error("Failed to log dose:", error);
            Alert.alert(
              "Error Logging Dose", 
              "Could not log the dose. Please try again."
            );
          } finally {
            // Refresh data in background
            await refreshData();
          }
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
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
});