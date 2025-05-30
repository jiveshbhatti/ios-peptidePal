import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';

interface SuccessAnimationProps {
  visible: boolean;
  onComplete: () => void;
  message?: string;
}

export default function SuccessAnimation({
  visible,
  onComplete,
  message = 'Success!',
}: SuccessAnimationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset values
      opacity.value = 0;
      scale.value = 0.3;
      
      // Start animation sequence
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back()) }),
        withTiming(1, { duration: 200 })
      );
      
      // Use a simple timeout instead of complex animation callbacks
      timeoutRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        
        // Call onComplete after fade out
        setTimeout(() => {
          onComplete();
        }, 300);
      }, 1500); // Total display time: 500ms for animations + 1000ms display
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, onComplete]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, containerStyle]}>
          <View style={styles.iconContainer}>
            <Icon.CheckCircle
              width={60}
              height={60}
              color={theme.colors.secondary}
              strokeWidth={2.5}
            />
          </View>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: theme.colors.secondary + '15', // 15% opacity version of the color
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[800],
    textAlign: 'center',
  },
});