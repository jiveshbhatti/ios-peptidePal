import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '../config';
import NotificationService from '@/services/NotificationService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import * as Icon from 'react-native-feather';
import { Theme } from '@/constants/theme';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { theme, themeMode, setThemeMode } = useTheme();
  const styles = createStyles(theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    doseReminders: true,
    expiryAlerts: true,
    soundEnabled: true,
  });

  // Load notification settings on mount
  useEffect(() => {
    const settings = NotificationService.getSettings();
    setNotificationsEnabled(settings.enabled);
    setNotificationSettings({
      doseReminders: settings.doseReminders,
      expiryAlerts: settings.expiryAlerts,
      soundEnabled: settings.soundEnabled,
    });
  }, []);
  
  // Handle toggling notifications
  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await NotificationService.setNotificationsEnabled(newValue);
    
    if (newValue) {
      // Request permissions when enabling
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive dose reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setNotificationsEnabled(false);
      }
    }
  };

  // Handle toggling specific notification types
  const toggleNotificationSetting = async (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    };
    setNotificationSettings(newSettings);
    
    switch (setting) {
      case 'doseReminders':
        await NotificationService.setDoseRemindersEnabled(newSettings.doseReminders);
        break;
      case 'expiryAlerts':
        await NotificationService.setExpiryAlertsEnabled(newSettings.expiryAlerts);
        break;
      case 'soundEnabled':
        await NotificationService.setSoundEnabled(newSettings.soundEnabled);
        break;
    }
  };
  
  // Handle theme mode selection
  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme mode',
      [
        { text: 'Light', onPress: () => setThemeMode('light') },
        { text: 'Dark', onPress: () => setThemeMode('dark') },
        { text: 'System', onPress: () => setThemeMode('system') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.settingButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>My Profile</Text>
              <Text style={styles.settingDescription}>View metrics and track progress</Text>
            </View>
            <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>Master toggle for all notifications</Text>
          </View>
          <Switch 
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
            thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.gray[100]}
          />
        </View>
        
        {notificationsEnabled && (
          <>
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Dose Reminders</Text>
                <Text style={styles.settingDescription}>Get notified when it's time for your dose</Text>
              </View>
              <Switch 
                value={notificationSettings.doseReminders}
                onValueChange={() => toggleNotificationSetting('doseReminders')}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
                thumbColor={notificationSettings.doseReminders ? theme.colors.primary : theme.colors.gray[100]}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Expiry Alerts</Text>
                <Text style={styles.settingDescription}>Get notified when vials are expiring</Text>
              </View>
              <Switch 
                value={notificationSettings.expiryAlerts}
                onValueChange={() => toggleNotificationSetting('expiryAlerts')}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
                thumbColor={notificationSettings.expiryAlerts ? theme.colors.primary : theme.colors.gray[100]}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Notification Sound</Text>
                <Text style={styles.settingDescription}>Play sound for notifications</Text>
              </View>
              <Switch 
                value={notificationSettings.soundEnabled}
                onValueChange={() => toggleNotificationSetting('soundEnabled')}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
                thumbColor={notificationSettings.soundEnabled ? theme.colors.primary : theme.colors.gray[100]}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleThemeChange}>
          <View style={styles.settingContent}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Theme</Text>
              <Text style={styles.settingDescription}>
                {themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
            <Icon.ChevronRight color={theme.colors.gray[400]} width={20} height={20} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => {
            if (config.isDevMode) {
              // In development mode, show sync options
              Alert.alert(
                'Sync Data', 
                'Choose sync direction:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Prod → Dev', 
                    onPress: async () => {
                      try {
                        // Show loading indicator
                        Alert.alert('Syncing...', 'Downloading data from production to development database. This may take a moment.');
                        
                        // Import dynamically to avoid circular dependencies
                        const { syncFromProductionToDevelopment } = require('../config');
                        
                        // Perform the sync
                        const result = await syncFromProductionToDevelopment();
                        
                        if (result.success) {
                          Alert.alert('Sync Complete', result.message);
                        } else {
                          // Special handling for network errors
                          if (result.message && result.message.includes('Network request failed')) {
                            Alert.alert(
                              'Connection Error',
                              'Could not connect to development database. Please check your internet connection and database URL.',
                              [{ text: 'OK' }]
                            );
                          } else {
                            Alert.alert('Sync Failed', result.message);
                          }
                        }
                      } catch (error) {
                        Alert.alert('Sync Error', 'An unexpected error occurred during sync. Please try again later.');
                        console.error('Sync error:', error);
                      }
                    }
                  }
                ]
              );
            } else {
              // In production mode
              Alert.alert(
                'Sync Data',
                'This will synchronize your mobile data with the PeptidePal Web app.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sync', 
                    onPress: () => {
                      Alert.alert('Sync Complete', 'Your data has been synchronized with the web app.');
                    }
                  }
                ]
              );
            }
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.settingLabel}>Sync Data</Text>
              <Text style={styles.settingDescription}>
                {config.isDevMode ? 'Sync data between databases' : 'Sync with PeptidePal Web'}
              </Text>
            </View>
            <Icon.RefreshCw color={theme.colors.gray[400]} width={20} height={20} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => {
            Alert.alert(
              'Export Data',
              'This will export your data as a CSV file.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Export', onPress: () => Alert.alert('Export Complete', 'Your data has been exported.') }
              ]
            );
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your data as CSV</Text>
            </View>
            <Icon.Download color={theme.colors.gray[400]} width={20} height={20} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Database Mode</Text>
          <Text style={styles.infoValue}>{config.isDevMode ? 'Development' : 'Production'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Database URL</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
            {config.isDevMode ? config.SUPABASE_DEV_URL : config.SUPABASE_URL}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginVertical: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  settingButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[900],
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[900],
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    maxWidth: '60%',
  },
});