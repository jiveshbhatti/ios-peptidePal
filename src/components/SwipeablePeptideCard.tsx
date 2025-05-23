import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  PanResponder,
  Dimensions,
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';
import { Peptide } from '@/types/peptide';
import { AppHaptics } from '@/utils/haptics';
import Card from '@/components/ui/Card';
import { calculateRemainingDoses, formatDoseDisplay, getDrawVolumeForPeptide } from '@/utils/dose-calculations';

interface SwipeablePeptideCardProps {
  peptide: Peptide;
  scheduleTime: 'AM' | 'PM';
  isLogged: boolean;
  onLog: () => void;
  onRevert?: () => void;
  onPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;

export default function SwipeablePeptideCard({
  peptide,
  scheduleTime,
  isLogged,
  onLog,
  onRevert,
  onPress,
}: SwipeablePeptideCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const hasTriggeredHaptic = useRef(false);

  // Calculate remaining doses using consistent logic
  const remainingDoses = calculateRemainingDoses(peptide);
  const doseDisplay = formatDoseDisplay(remainingDoses);
  
  // Calculate draw volume
  const drawVolume = getDrawVolumeForPeptide(peptide);

  const renderLeftActions = (progress: Animated.AnimatedInterpolation) => {
    if (!isLogged || !onRevert) return null; // Only show when logged and revert is available

    const translateX = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [-100, -50, 0],
    });

    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 0.8, 1],
    });

    return (
      <View style={styles.leftAction}>
        <Animated.View
          style={[
            styles.actionIconContainer,
            {
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          <Icon.RotateCcw
            width={28}
            height={28}
            color="white"
            strokeWidth={2.5}
          />
          <Text style={styles.actionText}>Undo</Text>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation) => {
    if (isLogged) return null; // No right swipe when already logged

    const translateX = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [100, 50, 0],
    });

    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 0.8, 1],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 0.8, 1],
    });

    // Add glow effect for better visibility
    const glowRadius = progress.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0, 10, 20],
    });

    return (
      <Animated.View 
        style={[
          styles.rightAction,
          {
            opacity,
            shadowColor: theme.colors.secondary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: glowRadius,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.actionIconContainer,
            {
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          <Icon.CheckCircle
            width={32}
            height={32}
            color="white"
            strokeWidth={3}
          />
          <Text style={styles.actionText}>Log Dose</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const handleSwipeableOpen = (direction: 'left' | 'right') => {
    swipeableRef.current?.close();
    
    if (direction === 'right' && !isLogged) {
      AppHaptics.logDose();
      onLog();
    } else if (direction === 'left' && isLogged && onRevert) {
      AppHaptics.delete();
      onRevert();
    }
  };

  const onSwipeProgress = (direction: 'left' | 'right', progress: number) => {
    // Enhanced haptic feedback at multiple thresholds
    if (progress > 0.3 && progress < 0.4 && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      AppHaptics.selection();
    } else if (progress > 0.7 && hasTriggeredHaptic.current) {
      // Second haptic when close to activation
      hasTriggeredHaptic.current = false;
      AppHaptics.impactMedium();
    } else if (progress < 0.3) {
      hasTriggeredHaptic.current = false;
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      onSwipeableWillOpen={(direction) => {
        // Strong haptic feedback when about to activate
        AppHaptics.impactHeavy();
      }}
      leftThreshold={SWIPE_THRESHOLD}
      rightThreshold={SWIPE_THRESHOLD}
      overshootLeft={false}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
      childrenContainerStyle={styles.cardContainer}
      friction={2}
      overshootFriction={8}
    >
      <RectButton
        style={[styles.container, isLogged && styles.loggedContainer]}
        onPress={() => {
          AppHaptics.buttonTap();
          onPress();
        }}
      >
        <Card style={styles.card} variant="default">
          {isLogged && (
            <View style={styles.completedBadge}>
              <Icon.CheckCircle
                width={16}
                height={16}
                color={theme.colors.secondary}
                strokeWidth={3}
              />
            </View>
          )}

          <View style={styles.content}>
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
              <Text style={[styles.name, isLogged && styles.loggedText]}>
                {peptide.name}
              </Text>
              <Text style={[styles.schedule, isLogged && styles.loggedSubText]}>
                {scheduleTime} • {peptide.typicalDosageUnits}{peptide.dosageUnit}
              </Text>
              {drawVolume > 0 && (
                <Text style={[styles.drawVolume, isLogged && styles.loggedDrawVolume]}>
                  Draw {drawVolume} units
                </Text>
              )}
              {remainingDoses > 0 && (
                <Text
                  style={[
                    styles.status,
                    doseDisplay.isLowStock && styles.lowStock,
                    isLogged && styles.loggedSubText,
                  ]}
                >
                  {doseDisplay.text}
                </Text>
              )}
            </View>

            {/* Chevron for navigation hint */}
            <Icon.ChevronRight
              width={20}
              height={20}
              color={theme.colors.gray[400]}
            />
          </View>

          {/* Swipe hint for logging */}
          {!isLogged && (
            <View style={styles.swipeHint}>
              <Icon.ChevronRight
                width={14}
                height={14}
                color={theme.colors.secondary}
                style={{ opacity: 0.6 }}
              />
              <Icon.ChevronRight
                width={14}
                height={14}
                color={theme.colors.secondary}
                style={{ opacity: 0.4, marginLeft: -8 }}
              />
            </View>
          )}
        </Card>
      </RectButton>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  cardContainer: {
    borderRadius: theme.borderRadius.lg,
  },
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  card: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    margin: 0,
  },
  loggedContainer: {
    opacity: 0.95,
  },
  completedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 1,
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
    opacity: 0.8,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 2,
  },
  loggedText: {
    color: theme.colors.gray[600],
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
  drawVolume: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  loggedDrawVolume: {
    color: theme.colors.gray[600],
    fontWeight: '500',
  },
  leftAction: {
    backgroundColor: theme.colors.warning,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.xs,
  },
  rightAction: {
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.lg,
    marginLeft: theme.spacing.xs,
    overflow: 'visible', // Allow glow to show
  },
  actionIconContainer: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swipeHint: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    marginTop: -7,
    flexDirection: 'row',
    alignItems: 'center',
  },
});