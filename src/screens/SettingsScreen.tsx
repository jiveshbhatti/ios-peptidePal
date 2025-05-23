import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { theme } from '@/constants/theme';
import { config } from '../config';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Handle toggling notifications
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  // Handle toggling dark mode (placeholder for now)
  const toggleDarkMode = () => {
    Alert.alert(
      'Dark Mode',
      'Dark mode is not yet implemented',
      [{ text: 'OK' }]
    );
  };
  
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>Enable dose reminders and alerts</Text>
          </View>
          <Switch 
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
            thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.gray[100]}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Use dark theme throughout the app</Text>
          </View>
          <Switch 
            value={darkMode}
            onValueChange={() => toggleDarkMode()}
            trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary + '40' }}
            thumbColor={darkMode ? theme.colors.primary : theme.colors.gray[100]}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingLabel}>My Profile</Text>
          <Text style={styles.settingDescription}>View and edit your profile information</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingButton}
          onPress={() => {
            // Check if we're in development mode
            if (config.isDevelopment) {
              Alert.alert(
                'Development Mode Warning',
                'You are currently in DEVELOPMENT mode. Syncing with the web app will download data FROM production TO your development database. This is safe and will not affect production data.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sync Safely', 
                    onPress: async () => {
                      try {
                        // Firebase doesn't need separate dev/prod databases
                        // Data sync is not currently implemented for Firebase
                        
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
              <Text style={styles.settingLabel}>Sync with Web App</Text>
              <Text style={styles.settingDescription}>
                {config.isDevelopment 
                  ? "Download production data (safe mode)" 
                  : "Sync your data with PeptidePal Web"}
              </Text>
            </View>
            {config.isDevelopment && (
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>DEV</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingLabel}>Help & FAQ</Text>
          <Text style={styles.settingDescription}>Get answers to common questions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingLabel}>Contact Support</Text>
          <Text style={styles.settingDescription}>Reach out for assistance</Text>
        </TouchableOpacity>
      </View>
      
      {/* Version and Build Info */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>PeptidePal v1.0.0</Text>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: theme.spacing.lg,
    color: theme.colors.gray[800],
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  settingButton: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  versionInfo: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  versionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
  },
  devBadge: {
    backgroundColor: theme.colors.danger + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  devBadgeText: {
    color: theme.colors.danger,
    fontSize: 10,
    fontWeight: 'bold',
  },
});