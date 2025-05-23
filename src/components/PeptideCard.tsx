import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Peptide } from '@/types/peptide';
import Card from '@/components/ui/Card';
import { calculateRemainingDoses, formatDoseDisplay } from '@/utils/dose-calculations';

interface PeptideCardProps {
  peptide: Peptide;
  scheduleTime: 'AM' | 'PM';
  isLogged: boolean;
  onLog: () => void;
  onRevert?: () => void; // Optional callback for reverting a logged dose
  onPress: () => void;
}

export default function PeptideCard({
  peptide,
  scheduleTime,
  isLogged,
  onLog,
  onRevert,
  onPress,
}: PeptideCardProps) {
  // Animation values
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);
  
  // Animate when logged status changes
  useEffect(() => {
    if (isLogged) {
      // Animate scale and background when logged
      scale.value = withSequence(
        withTiming(1.03, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
      bgOpacity.value = withTiming(1, { duration: 600 });
    } else {
      // Reset animation values
      scale.value = 1;
      bgOpacity.value = 0;
    }
  }, [isLogged]);
  
  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const bgStyle = useAnimatedStyle(() => {
    return {
      opacity: bgOpacity.value,
    };
  });
  
  // Calculate remaining doses using consistent logic
  const remainingDoses = calculateRemainingDoses(peptide);
  const doseDisplay = formatDoseDisplay(remainingDoses);

  return (
    <Animated.View style={animatedStyle}>
      <Card style={[styles.container, isLogged && styles.loggedContainer]} variant="default">
        {isLogged && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
        {isLogged && (
          <Animated.View style={[styles.glowBackground, bgStyle]} />
        )}
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.7}
        >
        <View style={styles.imageContainer}>
          {peptide.imageUrl ? (
            <Image
              source={{ uri: peptide.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imageText}>
                {peptide.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.info, isLogged && styles.loggedInfo]}>
          <Text style={[styles.name, isLogged && styles.loggedText]}>{peptide.name}</Text>
          <Text style={[styles.schedule, isLogged && styles.loggedSubText]}>
            {scheduleTime} • {peptide.typicalDosageUnits}{peptide.dosageUnit}
          </Text>
          {remainingDoses > 0 && (
            <Text style={[styles.status, doseDisplay.isLowStock && styles.lowStock, isLogged && styles.loggedSubText]}>
              {doseDisplay.text}
            </Text>
          )}
        </View>

        {isLogged ? (
          // When dose is already logged, display a non-touchable indicator with revert option
          <View style={[styles.logButton, styles.loggedButton]}>
            <View style={styles.loggedIndicator}>
              <Icon.CheckCircle
                width={24}
                height={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.loggedIndicatorText}>Logged</Text>
              
              {/* Revert button */}
              {onRevert && (
                <TouchableOpacity
                  style={styles.revertButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRevert();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon.RotateCcw
                    width={20}
                    height={20}
                    color={theme.colors.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          // When dose is not logged, display the actionable button
          <TouchableOpacity
            style={styles.logButton}
            onPress={(e) => {
              e.stopPropagation();
              onLog();
            }}
          >
            <View style={styles.logButtonInner}>
              <Text style={styles.logButtonText}>Log</Text>
            </View>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden', // For the badge positioning
    position: 'relative', // For absolute positioning of the badge
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.secondary + '15', // 15% opacity of secondary color
    borderRadius: 20,
    zIndex: -1, // Behind content
  },
  loggedContainer: {
    backgroundColor: '#E8F7F4',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: -34,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 30,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: theme.spacing.md,
  },
  image: {
    width: 54,
    height: 54,
    borderRadius: theme.borderRadius.full,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  loggedInfo: {
    opacity: 0.9,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  loggedText: {
    color: theme.colors.gray[700],
  },
  schedule: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
  },
  loggedSubText: {
    color: theme.colors.gray[500],
  },
  status: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  lowStock: {
    color: theme.colors.warning,
  },
  logButton: {
    width: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedButton: {
    backgroundColor: 'transparent',
  },
  logButtonInner: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 28,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  loggedIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F7F4',
    borderRadius: 28,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  loggedIndicatorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.secondary,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 4,
  },
  revertButton: {
    marginTop: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
});