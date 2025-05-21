import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { config, switchToDevelopmentDb, switchToProductionDb } from '../../config';
import { theme } from '@/constants/theme';
import { updateSupabaseClient } from '@/services/supabase-dynamic';

// This component provides developer controls that can be added to settings screens
// or developer-only screens to control which database environment is used

interface DevControlsProps {
  onEnvironmentSwitch?: () => void; // Optional callback for when environment is switched
}

export default function DevControls({ onEnvironmentSwitch }: DevControlsProps) {
  // Force refresh from config to ensure we're showing the correct state
  const [isDev, setIsDev] = useState(() => config.isDevelopment);

  // Toggle environment
  const toggleEnvironment = () => {
    Alert.alert(
      'Switch Database Environment',
      `Switch to ${isDev ? 'PRODUCTION' : 'DEVELOPMENT'} database?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          style: 'destructive',
          onPress: () => {
            // Print current environment info before switch
            console.log("ENVIRONMENT BEFORE SWITCH:", JSON.stringify(config.getEnvironmentInfo()));
          
            if (isDev) {
              switchToProductionDb();
            } else {
              switchToDevelopmentDb();
            }
            
            // Print environment info after switch
            console.log("ENVIRONMENT AFTER SWITCH:", JSON.stringify(config.getEnvironmentInfo()));
            
            // Update the Supabase client to use the new environment
            updateSupabaseClient();
            
            setIsDev(!isDev);
            
            // Call the callback if provided
            if (onEnvironmentSwitch) {
              onEnvironmentSwitch();
            }
            
            // Show confirmation
            Alert.alert(
              'Environment Switched',
              `Now using ${isDev ? 'PRODUCTION' : 'DEVELOPMENT'} database.\n\nYou should restart the app for best results.`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Developer Settings</Text>
        <View style={[
          styles.envBadge, 
          isDev ? styles.devBadge : styles.prodBadge
        ]}>
          <Text style={[
            styles.envBadgeText,
            isDev ? styles.devBadgeText : styles.prodBadgeText
          ]}>
            {isDev ? 'DEV DB' : 'PROD DB'}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Current Environment:</Text>
        <Text style={styles.infoText}>
          {isDev 
            ? "DEVELOPMENT - Safe for testing, won't affect production data" 
            : "PRODUCTION - Changes will affect real user data"}
        </Text>
        <Text style={styles.infoUrl}>
          URL: {config.supabase.url.substring(0, 20)}...
        </Text>
      </View>
      
      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Switch Environment</Text>
          <Text style={styles.settingDescription}>
            Toggle between development and production
          </Text>
        </View>
        <Switch 
          value={isDev}
          onValueChange={toggleEnvironment} 
          trackColor={{ false: theme.colors.danger + '40', true: theme.colors.success + '40' }}
          thumbColor={isDev ? theme.colors.success : theme.colors.danger}
        />
      </View>
      
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Database Safety Warning</Text>
        <Text style={styles.warningText}>
          • When in <Text style={styles.prodHighlight}>PRODUCTION</Text> mode, all changes affect real user data{'\n'}
          • Use <Text style={styles.devHighlight}>DEVELOPMENT</Text> mode for testing new features{'\n'}
          • The sync feature always downloads FROM production TO development{'\n'}
          • Development data is never uploaded to production
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.gray[800],
  },
  envBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  devBadge: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  prodBadge: {
    backgroundColor: theme.colors.danger + '20',
    borderColor: theme.colors.danger,
  },
  envBadgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  devBadgeText: {
    color: theme.colors.success,
  },
  prodBadgeText: {
    color: theme.colors.danger,
  },
  infoBox: {
    backgroundColor: theme.colors.gray[100],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.gray[700],
    marginBottom: 4,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[700],
    marginBottom: 4,
  },
  infoUrl: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    fontFamily: 'monospace',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    marginBottom: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
  },
  warningBox: {
    backgroundColor: theme.colors.danger + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.danger,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.danger,
    marginBottom: 4,
  },
  warningText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[700],
    lineHeight: 20,
  },
  prodHighlight: {
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  devHighlight: {
    fontWeight: 'bold', 
    color: theme.colors.success,
  }
});