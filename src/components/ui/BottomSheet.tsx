import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Text,
  SafeAreaView,
} from 'react-native';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';

const { height: screenHeight } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: number | string;
  footer?: React.ReactNode;
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  title,
  height = '60%',
  footer,
}: BottomSheetProps) {
  // Start position is offscreen
  const translateY = useRef(new Animated.Value(screenHeight * 2)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          close();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Use regular effect for animation
  React.useEffect(() => {
    // Set a small delay to prevent useInsertionEffect warning
    const timer = setTimeout(() => {
      if (visible) {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, [visible, translateY, screenHeight]);

  const close = () => {
    // Use a small delay to prevent useInsertionEffect warning
    setTimeout(() => {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onClose());
    }, 10);
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={close}
        >
          <Animated.View
            style={[
              styles.container,
              {
                height: typeof height === 'number' ? height : undefined,
                maxHeight: typeof height === 'string' ? height : undefined,
                transform: [{ translateY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.innerContainer}>
              <View style={styles.handle} />
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={close} style={styles.closeButton}>
                    <Icon.X
                      width={28}
                      height={28}
                      color={theme.colors.gray[600]}
                    />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.content}>{children}</View>
              {footer && <View style={styles.footer}>{footer}</View>}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 44, // Enhanced safe area
    minHeight: '60%', // Increased minimum height to show content
    maxHeight: '95%', // Maximum height to avoid being cut off
  },
  innerContainer: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.gray[800],
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
    minHeight: 200, // Ensure minimum content height
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    backgroundColor: theme.colors.background, // Ensures footer is visible on scroll
    marginTop: theme.spacing.md,
  },
});