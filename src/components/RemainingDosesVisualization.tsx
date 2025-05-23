import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface RemainingDosesVisualizationProps {
  initialDoses: number;
  remainingDoses: number;
}

export default function RemainingDosesVisualization({ 
  initialDoses, 
  remainingDoses 
}: RemainingDosesVisualizationProps) {
  const percentage = (remainingDoses / initialDoses) * 100;
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage > 50) return theme.colors.secondary;
    if (percentage > 20) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Svg height={radius * 2} width={radius * 2}>
          {/* Background circle */}
          <Circle
            stroke={theme.colors.gray[200]}
            fill="none"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <Circle
            stroke={getColor()}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </Svg>
        <View style={styles.textContainer}>
          <Text style={styles.remainingNumber}>{remainingDoses}</Text>
          <Text style={styles.totalText}>of {initialDoses}</Text>
          <Text style={styles.labelText}>doses left</Text>
        </View>
      </View>
      
      <View style={styles.percentageContainer}>
        <Text style={[styles.percentageText, { color: getColor() }]}>
          {percentage.toFixed(0)}% remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  remainingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
  },
  totalText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: -4,
  },
  labelText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.xs,
  },
  percentageContainer: {
    marginTop: theme.spacing.md,
  },
  percentageText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});