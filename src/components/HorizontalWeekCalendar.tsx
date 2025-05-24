import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { theme } from '@/constants/theme';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import * as Icon from 'react-native-feather';
import { AppHaptics } from '@/utils/haptics';

const { width: screenWidth } = Dimensions.get('window');
const DAY_WIDTH = (screenWidth - 40) / 7; // 40 for padding

interface HorizontalWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: { [date: string]: { marked: boolean; dotColor?: string } };
  onWeekChange?: (startDate: Date) => void;
}

export const HorizontalWeekCalendar: React.FC<HorizontalWeekCalendarProps> = ({
  selectedDate,
  onDateSelect,
  markedDates = {},
  onWeekChange,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(selectedDate, { weekStartsOn: 0 })
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Center on today when component mounts
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    setCurrentWeekStart(weekStart);
  }, []);

  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = screenWidth / 4;
        
        if (gestureState.dx > threshold) {
          // Swipe right - go to previous week
          goToPreviousWeek();
        } else if (gestureState.dx < -threshold) {
          // Swipe left - go to next week
          goToNextWeek();
        }
        
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    onWeekChange?.(currentWeekStart);
  }, [currentWeekStart, onWeekChange]);

  const animateWeekChange = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 150);
  };

  const goToPreviousWeek = () => {
    AppHaptics.selection();
    animateWeekChange(() => {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    });
  };

  const goToNextWeek = () => {
    AppHaptics.selection();
    animateWeekChange(() => {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    });
  };

  const goToToday = () => {
    AppHaptics.success();
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    animateWeekChange(() => {
      setCurrentWeekStart(weekStart);
      onDateSelect(today);
    });
  };

  const renderDay = (date: Date, index: number) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    const marked = markedDates[dateString];

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay,
          isToday && styles.todayContainer,
        ]}
        onPress={() => {
          AppHaptics.selection();
          onDateSelect(date);
        }}
      >
        <Text style={[
          styles.dayName,
          isSelected && styles.selectedDayText,
          isToday && styles.todayText,
        ]}>
          {format(date, 'EEE')}
        </Text>
        <View style={[
          styles.dayNumberContainer,
          isSelected && styles.selectedDayNumberContainer,
          isToday && !isSelected && styles.todayNumberContainer,
        ]}>
          <Text style={[
            styles.dayNumber,
            isSelected && styles.selectedDayNumber,
            isToday && !isSelected && styles.todayNumber,
          ]}>
            {format(date, 'd')}
          </Text>
        </View>
        {marked?.marked && (
          <View style={[
            styles.dot,
            { backgroundColor: marked.dotColor || theme.colors.primary },
            isSelected && styles.selectedDot,
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const isCurrentWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 0 }));

  return (
    <View style={styles.container}>
      {/* Month and Year Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.arrowButton}>
          <Icon.ChevronLeft color={theme.colors.gray[600]} width={20} height={20} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToToday} style={styles.monthYearContainer}>
          <Text style={styles.monthYear}>
            {format(addDays(currentWeekStart, 3), 'MMMM yyyy')}
          </Text>
          {!isCurrentWeek && (
            <View style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextWeek} style={styles.arrowButton}>
          <Icon.ChevronRight color={theme.colors.gray[600]} width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <Animated.View 
        style={[
          styles.weekContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.weekContent}
        >
          {weekDays.map((date, index) => renderDay(date, index))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  arrowButton: {
    padding: theme.spacing.sm,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  monthYear: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  todayButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  todayButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  weekContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  weekContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayContainer: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  todayContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedDayText: {
    color: 'white',
  },
  todayText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  selectedDayNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  todayNumberContainer: {
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  selectedDayNumber: {
    color: 'white',
    fontWeight: '600',
  },
  todayNumber: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  selectedDot: {
    backgroundColor: 'white',
  },
});