import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Peptide } from '@/types/peptide';
import { format, addDays, set, isAfter, isBefore, addWeeks } from 'date-fns';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Storage keys
const NOTIFICATION_SETTINGS_KEY = '@PeptidePal:notificationSettings';
const SCHEDULED_NOTIFICATIONS_KEY = '@PeptidePal:scheduledNotifications';

interface NotificationSettings {
  enabled: boolean;
  doseReminders: boolean;
  expiryAlerts: boolean;
  soundEnabled: boolean;
  reminderMinutesBefore: number; // How many minutes before dose time to remind
}

interface ScheduledNotification {
  id: string;
  peptideId: string;
  peptideName: string;
  time: 'AM' | 'PM';
  type: 'dose' | 'expiry';
  date: string;
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    enabled: true,
    doseReminders: true,
    expiryAlerts: true,
    soundEnabled: true,
    reminderMinutesBefore: 15,
  };

  private constructor() {
    this.loadSettings();
    this.setupNotificationListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Load settings from AsyncStorage
  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  // Save settings to AsyncStorage
  private async saveSettings() {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  // Setup notification response listeners
  private setupNotificationListeners() {
    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.type === 'dose') {
        // Handle dose reminder actions
        const action = response.actionIdentifier;
        
        switch (action) {
          case 'log':
            // TODO: Navigate to dose logging
            console.log('Log dose for:', data.peptideId);
            break;
          case 'snooze':
            // Reschedule for 10 minutes later
            this.snoozeDoseReminder(data);
            break;
          default:
            // Default tap - open app
            console.log('Open app for dose:', data.peptideId);
        }
      }
    });
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    
    return true;
  }

  // Toggle all notifications
  async setNotificationsEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    await this.saveSettings();
    
    if (!enabled) {
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Update settings
  async updateSettings(updates: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();
  }

  // Schedule dose reminders for a peptide
  async scheduleDoseReminders(peptide: Peptide) {
    if (!this.settings.enabled || !this.settings.doseReminders) return;
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Cancel existing reminders for this peptide
    await this.cancelPeptideDoseReminders(peptide.id);

    // Schedule reminders for the next 7 days
    const today = new Date();
    const notifications: ScheduledNotification[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();

      // Check if peptide is scheduled for this day
      if (peptide.schedule) {
        if (peptide.schedule.frequency === 'daily' || 
            (peptide.schedule.frequency === 'specific_days' && 
             peptide.schedule.daysOfWeek?.includes(dayOfWeek))) {
          
          // Schedule for each time (AM/PM)
          for (const time of peptide.schedule.times) {
            const notificationTime = this.getNotificationTime(date, time);
            
            // Only schedule future notifications
            if (isAfter(notificationTime, new Date())) {
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: `Time for ${peptide.name}`,
                  body: `${time} dose: ${peptide.defaultDosageValue}${peptide.defaultDosageUnit}`,
                  sound: this.settings.soundEnabled,
                  data: {
                    type: 'dose',
                    peptideId: peptide.id,
                    peptideName: peptide.name,
                    time,
                    dosage: peptide.defaultDosageValue,
                    unit: peptide.defaultDosageUnit,
                  },
                  categoryIdentifier: 'dose_reminder',
                },
                trigger: notificationTime,
              });

              notifications.push({
                id: notificationId,
                peptideId: peptide.id,
                peptideName: peptide.name,
                time,
                type: 'dose',
                date: format(date, 'yyyy-MM-dd'),
              });
            }
          }
        }
      }
    }

    // Store scheduled notifications
    await this.saveScheduledNotifications(peptide.id, notifications);
  }

  // Get notification time based on AM/PM and reminder settings
  private getNotificationTime(date: Date, time: 'AM' | 'PM'): Date {
    const baseHour = time === 'AM' ? 8 : 20; // 8 AM or 8 PM
    let notificationTime = set(date, { hours: baseHour, minutes: 0, seconds: 0, milliseconds: 0 });
    
    // Subtract reminder minutes
    notificationTime = new Date(notificationTime.getTime() - this.settings.reminderMinutesBefore * 60000);
    
    return notificationTime;
  }

  // Snooze a dose reminder
  private async snoozeDoseReminder(data: any) {
    const snoozeTime = new Date(Date.now() + 10 * 60000); // 10 minutes from now
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Snoozed: Time for ${data.peptideName}`,
        body: `${data.time} dose: ${data.dosage}${data.unit}`,
        sound: this.settings.soundEnabled,
        data: data,
        categoryIdentifier: 'dose_reminder',
      },
      trigger: snoozeTime,
    });
  }

  // Schedule expiry alerts for a vial
  async scheduleExpiryAlert(peptideId: string, peptideName: string, expiryDate: Date) {
    if (!this.settings.enabled || !this.settings.expiryAlerts) return;
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Schedule alerts at 7 days, 3 days, and 1 day before expiry
    const alertDays = [7, 3, 1];
    
    for (const daysBefore of alertDays) {
      const alertDate = set(addDays(expiryDate, -daysBefore), { 
        hours: 9, 
        minutes: 0, 
        seconds: 0, 
        milliseconds: 0 
      });
      
      // Only schedule future alerts
      if (isAfter(alertDate, new Date())) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Vial Expiring Soon',
            body: `${peptideName} vial expires in ${daysBefore} day${daysBefore > 1 ? 's' : ''}`,
            sound: this.settings.soundEnabled,
            priority: 'high',
            data: {
              type: 'expiry',
              peptideId,
              peptideName,
              daysUntilExpiry: daysBefore,
            },
          },
          trigger: alertDate,
        });
      }
    }
  }

  // Cancel all dose reminders for a peptide
  async cancelPeptideDoseReminders(peptideId: string) {
    const scheduled = await this.getScheduledNotifications(peptideId);
    
    for (const notification of scheduled) {
      if (notification.type === 'dose') {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }
    }
    
    await this.removeScheduledNotifications(peptideId, 'dose');
  }

  // Cancel all notifications for a peptide
  async cancelAllPeptideNotifications(peptideId: string) {
    const scheduled = await this.getScheduledNotifications(peptideId);
    
    for (const notification of scheduled) {
      await Notifications.cancelScheduledNotificationAsync(notification.id);
    }
    
    await this.removeScheduledNotifications(peptideId);
  }

  // Get scheduled notifications for a peptide
  private async getScheduledNotifications(peptideId: string): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(`${SCHEDULED_NOTIFICATIONS_KEY}:${peptideId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
      return [];
    }
  }

  // Save scheduled notifications
  private async saveScheduledNotifications(peptideId: string, notifications: ScheduledNotification[]) {
    try {
      await AsyncStorage.setItem(
        `${SCHEDULED_NOTIFICATIONS_KEY}:${peptideId}`,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  // Remove scheduled notifications
  private async removeScheduledNotifications(peptideId: string, type?: 'dose' | 'expiry') {
    if (!type) {
      // Remove all notifications for this peptide
      await AsyncStorage.removeItem(`${SCHEDULED_NOTIFICATIONS_KEY}:${peptideId}`);
    } else {
      // Remove only specific type
      const scheduled = await this.getScheduledNotifications(peptideId);
      const filtered = scheduled.filter(n => n.type !== type);
      await this.saveScheduledNotifications(peptideId, filtered);
    }
  }

  // Setup notification categories (for iOS)
  async setupNotificationCategories() {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('dose_reminder', [
        {
          identifier: 'log',
          buttonTitle: 'Log Dose',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'snooze',
          buttonTitle: 'Snooze 10 min',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    }
  }
}

export default NotificationService.getInstance();