import { Platform } from 'react-native';
// Temporarily disabled - Siri Shortcuts require native module setup
// import SiriShortcuts, { 
//   ShortcutOptions, 
//   PresentShortcutCallbackData,
//   Activity
// } from 'react-native-siri-shortcut';
import firebaseService from './firebase-wrapper';
import { calculateRemainingDoses } from '../utils/dose-calculations';
import { Peptide } from '../types/peptide';
import { AppHaptics } from '../utils/haptics';

// Temporary types until we can properly integrate Siri
type ShortcutOptions = any;
type Activity = any;
const SiriShortcuts = {
  addListener: () => ({ remove: () => {} }),
  getInitialShortcut: () => Promise.resolve(null),
  donateShortcut: () => {},
  presentShortcut: () => Promise.resolve({}),
  getShortcuts: () => Promise.resolve([]),
  clearAllShortcuts: () => Promise.resolve(),
};

type TimeOfDay = 'AM' | 'PM';

export interface SiriShortcutActivity {
  activityType: string;
  title: string;
  phrase: string;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
  needsUserConfirmation: boolean;
  keywords: string[];
  persistentIdentifier: string;
  userInfo?: any;
}

class SiriShortcutsManager {
  private isInitialized = false;
  private currentPeptides: Peptide[] = [];

  constructor() {
    if (Platform.OS === 'ios') {
      this.setupListeners();
    }
  }

  private setupListeners() {
    // Listen for shortcut being triggered
    const subscription = SiriShortcuts.addListener(
      'SiriShortcutListener',
      ({ userInfo, activityType }) => {
        console.log('Siri Shortcut triggered:', { activityType, userInfo });
        this.handleShortcutAction(activityType, userInfo);
      }
    );

    // Get initial shortcut if app was launched from one
    SiriShortcuts.getInitialShortcut()
      .then((shortcut) => {
        if (shortcut) {
          console.log('App launched from shortcut:', shortcut);
          this.handleShortcutAction(shortcut.activityType, shortcut.userInfo);
        }
      })
      .catch((error) => {
        console.error('Error getting initial shortcut:', error);
      });

    this.isInitialized = true;
  }

  // Update peptides data for shortcuts
  updatePeptides(peptides: Peptide[]) {
    this.currentPeptides = peptides;
  }

  // Handle shortcut actions
  private async handleShortcutAction(activityType: string, userInfo?: any) {
    try {
      switch (activityType) {
        case 'com.jiveshbhatti.peptidepal.LogMorningDose':
          await this.handleLogDose('AM');
          break;
        case 'com.jiveshbhatti.peptidepal.LogEveningDose':
          await this.handleLogDose('PM');
          break;
        case 'com.jiveshbhatti.peptidepal.CheckRemainingDoses':
          await this.handleCheckRemainingDoses();
          break;
        default:
          console.log('Unknown shortcut activity type:', activityType);
      }
    } catch (error) {
      console.error('Error handling shortcut action:', error);
      AppHaptics.notificationError();
    }
  }

  // Handle dose logging from Siri
  private async handleLogDose(timeOfDay: TimeOfDay) {
    try {
      // Get peptides scheduled for this time
      const scheduledPeptides = this.currentPeptides.filter(peptide => {
        const hasActiveVial = peptide.vials?.some(v => v.isActive || v.isCurrent);
        if (!hasActiveVial) return false;

        const schedule = peptide.schedule;
        if (!schedule) return false;

        if (timeOfDay === 'AM') {
          return schedule.morning || schedule.AM;
        } else {
          return schedule.evening || schedule.PM || schedule.night;
        }
      });

      if (scheduledPeptides.length === 0) {
        // No peptides scheduled
        AppHaptics.notificationError();
        console.log(`No peptides scheduled for ${timeOfDay}`);
        return;
      }

      // Log doses for all scheduled peptides
      const results = await Promise.all(
        scheduledPeptides.map(async (peptide) => {
          try {
            const doseData = {
              date: new Date().toISOString(),
              timeOfDay,
              amount: peptide.typicalDosageUnits || 0,
              dosage: peptide.typicalDosageUnits || 0,
              unit: peptide.dosageUnit || 'mcg',
            };

            await firebaseService.addDoseLog(peptide.id, doseData);
            return { success: true, peptide: peptide.name };
          } catch (error) {
            console.error(`Error logging dose for ${peptide.name}:`, error);
            return { success: false, peptide: peptide.name };
          }
        })
      );

      // Haptic feedback
      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        AppHaptics.notificationSuccess();
        console.log(`Successfully logged ${timeOfDay} doses for:`, results.map(r => r.peptide).join(', '));
      } else {
        AppHaptics.notificationWarning();
        const failed = results.filter(r => !r.success).map(r => r.peptide);
        console.log(`Failed to log doses for:`, failed.join(', '));
      }

      // Donate the shortcut after successful use
      this.donateShortcut(timeOfDay === 'AM' ? 'LogMorningDose' : 'LogEveningDose');
    } catch (error) {
      console.error('Error in handleLogDose:', error);
      AppHaptics.notificationError();
    }
  }

  // Handle checking remaining doses
  private async handleCheckRemainingDoses() {
    try {
      const activePeptides = this.currentPeptides.filter(peptide => 
        peptide.vials?.some(v => v.isActive || v.isCurrent)
      );

      if (activePeptides.length === 0) {
        console.log('No active peptides');
        return;
      }

      const dosesInfo = activePeptides.map(peptide => {
        const remainingDoses = calculateRemainingDoses(peptide);
        return `${peptide.name}: ${remainingDoses} doses`;
      });

      console.log('Remaining doses:', dosesInfo.join(', '));
      
      // Donate the shortcut after use
      this.donateShortcut('CheckRemainingDoses');
    } catch (error) {
      console.error('Error checking remaining doses:', error);
    }
  }

  // Donate shortcuts to Siri
  donateShortcut(shortcutType: 'LogMorningDose' | 'LogEveningDose' | 'CheckRemainingDoses') {
    if (Platform.OS !== 'ios') return;

    const activities: Record<string, Activity> = {
      LogMorningDose: {
        activityType: 'com.jiveshbhatti.peptidepal.LogMorningDose',
        title: 'Log Morning Dose',
        suggestedInvocationPhrase: 'Log morning dose',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
        keywords: ['peptide', 'dose', 'morning', 'log', 'AM'],
        persistentIdentifier: 'LogMorningDose',
      },
      LogEveningDose: {
        activityType: 'com.jiveshbhatti.peptidepal.LogEveningDose',
        title: 'Log Evening Dose',
        suggestedInvocationPhrase: 'Log evening dose',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
        keywords: ['peptide', 'dose', 'evening', 'log', 'PM'],
        persistentIdentifier: 'LogEveningDose',
      },
      CheckRemainingDoses: {
        activityType: 'com.jiveshbhatti.peptidepal.CheckRemainingDoses',
        title: 'Check Remaining Doses',
        suggestedInvocationPhrase: 'How many doses left',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
        keywords: ['peptide', 'doses', 'remaining', 'check', 'left'],
        persistentIdentifier: 'CheckRemainingDoses',
      }
    };

    const activity = activities[shortcutType];
    if (activity) {
      SiriShortcuts.donateShortcut(activity);
      console.log(`Donated ${shortcutType} shortcut to Siri`);
    }
  }

  // Present shortcut to user for adding to Siri
  async presentShortcut(shortcutType: 'LogMorningDose' | 'LogEveningDose' | 'CheckRemainingDoses') {
    if (Platform.OS !== 'ios') return;

    const options: Record<string, ShortcutOptions> = {
      LogMorningDose: {
        activityType: 'com.jiveshbhatti.peptidepal.LogMorningDose',
        title: 'Log Morning Dose',
        suggestedInvocationPhrase: 'Log morning dose',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
      },
      LogEveningDose: {
        activityType: 'com.jiveshbhatti.peptidepal.LogEveningDose',
        title: 'Log Evening Dose',
        suggestedInvocationPhrase: 'Log evening dose',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
      },
      CheckRemainingDoses: {
        activityType: 'com.jiveshbhatti.peptidepal.CheckRemainingDoses',
        title: 'Check Remaining Doses',
        suggestedInvocationPhrase: 'How many doses left',
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        needsUserConfirmation: false,
      }
    };

    const shortcutOptions = options[shortcutType];
    if (shortcutOptions) {
      try {
        const result = await SiriShortcuts.presentShortcut(shortcutOptions);
        console.log('Shortcut presented:', result);
        return result;
      } catch (error) {
        console.error('Error presenting shortcut:', error);
        throw error;
      }
    }
  }

  // Get all available shortcuts
  async getAvailableShortcuts() {
    if (Platform.OS !== 'ios') return [];

    try {
      const shortcuts = await SiriShortcuts.getShortcuts();
      return shortcuts;
    } catch (error) {
      console.error('Error getting shortcuts:', error);
      return [];
    }
  }

  // Clear all shortcuts
  async clearAllShortcuts() {
    if (Platform.OS !== 'ios') return;

    try {
      await SiriShortcuts.clearAllShortcuts();
      console.log('All shortcuts cleared');
    } catch (error) {
      console.error('Error clearing shortcuts:', error);
    }
  }
}

// Export singleton instance
export default new SiriShortcutsManager();