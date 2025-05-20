import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import * as dateUtils from '@/utils/date';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Date[];
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  markedDates = [],
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const days = dateUtils.getDaysInMonth(currentMonth);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const isMarked = (date: Date) => {
    return markedDates.some(markedDate => dateUtils.isSameDay(date, markedDate));
  };

  const isSelected = (date: Date) => {
    return dateUtils.isSameDay(date, selectedDate);
  };

  // Get first day of month to calculate offset
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startOffset = firstDay.getDay();

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateMonth('prev')}
          style={styles.navButton}
        >
          <Icon.ChevronLeft
            width={24}
            height={24}
            color={theme.colors.gray[600]}
          />
        </TouchableOpacity>
        
        <Text style={styles.monthText}>{dateUtils.getMonthYear(currentMonth)}</Text>
        
        <TouchableOpacity
          onPress={() => navigateMonth('next')}
          style={styles.navButton}
        >
          <Icon.ChevronRight
            width={24}
            height={24}
            color={theme.colors.gray[600]}
          />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekDays}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.daysGrid}>
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}
        
        {/* Days of month */}
        {days.map((date) => {
          const isCurrentDay = dateUtils.isToday(date);
          const isDaySelected = isSelected(date);
          const isDayMarked = isMarked(date);
          
          return (
            <TouchableOpacity
              key={date.getTime()}
              style={[
                styles.dayCell,
                isCurrentDay && styles.todayCell,
                isDaySelected && styles.selectedCell,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text
                style={[
                  styles.dayText,
                  isCurrentDay && styles.todayText,
                  isDaySelected && styles.selectedText,
                ]}
              >
                {date.getDate()}
              </Text>
              {isDayMarked && !isDaySelected && (
                <View style={styles.marker} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today Button */}
      <TouchableOpacity
        style={styles.todayButton}
        onPress={() => {
          const today = new Date();
          setCurrentMonth(today);
          onDateSelect(today);
        }}
      >
        <Text style={styles.todayButtonText}>Go to Today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  monthText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  weekDayText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.gray[500],
    width: 40,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[800],
  },
  todayCell: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
  },
  todayText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: theme.colors.background,
    fontWeight: '600',
    fontSize: theme.typography.fontSize.lg,
  },
  marker: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  todayButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});