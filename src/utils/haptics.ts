/**
 * Haptic Feedback Utility
 * 
 * Provides consistent haptic feedback for iOS devices
 * Falls back gracefully on platforms that don't support haptics
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light impact - for subtle interactions like hover or selection
  light: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  // Medium impact - for standard button taps and confirmations
  medium: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  
  // Heavy impact - for important actions or errors
  heavy: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  
  // Selection changed - for picker changes, switches, etc.
  selection: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }
  },
  
  // Success notification - for successful actions
  success: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  
  // Warning notification - for warnings or important notices
  warning: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  
  // Error notification - for errors or failed actions
  error: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  
  // Custom pattern - for special interactions
  pattern: async (pattern: number[] = [0, 100, 100, 100]) => {
    if (Platform.OS === 'ios') {
      // Create a pattern of impacts
      for (let i = 0; i < pattern.length; i += 2) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, pattern[i]));
        }
        if (i + 1 < pattern.length) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await new Promise(resolve => setTimeout(resolve, pattern[i + 1]));
        }
      }
    }
  }
};

// Common haptic patterns for the app
export const AppHaptics = {
  // When user taps a button
  buttonTap: () => HapticFeedback.light(),
  
  // When user logs a dose
  logDose: () => HapticFeedback.success(),
  
  // When user deletes something
  delete: () => HapticFeedback.warning(),
  
  // When an error occurs
  error: () => HapticFeedback.error(),
  
  // When user switches tabs
  tabSwitch: () => HapticFeedback.selection(),
  
  // When user pulls to refresh
  pullToRefresh: () => HapticFeedback.medium(),
  
  // When user activates a vial
  activateVial: () => HapticFeedback.success(),
  
  // When user completes a form
  formSubmit: () => HapticFeedback.medium(),
  
  // When user swipes an item
  swipeAction: () => HapticFeedback.light(),
  
  // When a modal or sheet opens
  modalOpen: () => HapticFeedback.light(),
  
  // When a modal or sheet closes
  modalClose: () => HapticFeedback.light(),
  
  // When user selects something
  selection: () => HapticFeedback.selection(),
  
  // Standard impact haptics
  impactLight: () => HapticFeedback.light(),
  impactMedium: () => HapticFeedback.medium(),
  impactHeavy: () => HapticFeedback.heavy(),
  
  // Success notification
  success: () => HapticFeedback.success(),
};