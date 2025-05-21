import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useDatabase } from '@/contexts/DatabaseContext';
import { theme } from '@/constants/theme';

export default function DatabaseSwitcher() {
  const { 
    useFirebase, 
    toggleDatabase, 
    hasTestedFirebase, 
    connectionStatus,
    errorCount,
    resetFirebaseConnection
  } = useDatabase();

  const handleInfoPress = () => {
    Alert.alert(
      'Database Information',
      `Current Database: ${useFirebase ? 'Firebase' : 'Supabase'}\n\n` +
      `Connection Status: ${connectionStatus}\n\n` +
      `Connection Errors: ${errorCount}\n\n` +
      `Migration Status: ${hasTestedFirebase ? 'Migration started' : 'Not migrated yet'}\n\n` +
      'To migrate your data, run:\nnpm run migrate-to-firebase\n\n' +
      'This will export your Supabase data and import it to Firebase.',
      [
        { text: 'OK' },
        useFirebase ? { 
          text: 'Reset Connection', 
          onPress: async () => {
            const success = await resetFirebaseConnection();
            if (success) {
              Alert.alert('Success', 'Firebase connection has been reset.');
            } else {
              Alert.alert('Error', 'Could not reset Firebase connection.');
            }
          }
        } : undefined,
        useFirebase && errorCount > 0 ? {
          text: 'Switch to Supabase',
          style: 'destructive',
          onPress: () => {
            toggleDatabase();
            Alert.alert(
              'Switched to Supabase',
              'Due to connection issues, you have been switched back to Supabase. ' +
              'Your data is safe in both databases.'
            );
          }
        } : undefined
      ].filter(Boolean)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.switcherContainer}>
        <Text style={styles.label}>Database:</Text>
        <TouchableOpacity onPress={handleInfoPress}>
          <Text style={[
            styles.source, 
            useFirebase ? styles.firebase : styles.supabase
          ]}>
            {useFirebase ? 'Firebase' : 'Supabase'} 
            <Text style={styles.infoIcon}>ℹ️</Text>
          </Text>
        </TouchableOpacity>
        <Switch
          value={useFirebase}
          onValueChange={toggleDatabase}
          trackColor={{ false: '#767577', true: '#4285F4' }}
          thumbColor={useFirebase ? '#FFFFFF' : '#FFFFFF'}
          ios_backgroundColor="#767577"
          style={styles.switch}
        />
      </View>
      <View style={styles.statusContainer}>
        {connectionStatus === 'connecting' && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.statusIndicator} />
        )}
        {connectionStatus === 'error' && (
          <TouchableOpacity onPress={resetFirebaseConnection}>
            <Text style={styles.errorText}>⚠️</Text>
          </TouchableOpacity>
        )}
        {errorCount > 0 && (
          <TouchableOpacity onPress={resetFirebaseConnection}>
            <Text style={styles.errorCount}>{errorCount}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.note}>
          {useFirebase 
            ? `Using Firebase (NoSQL)${hasTestedFirebase ? '' : ' - No data migrated yet'}${
                errorCount > 0 ? ' - Connection issues' : ''
              }` 
            : 'Using Supabase (PostgreSQL)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  switcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  source: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  supabase: {
    color: '#3ECF8E', // Supabase green
  },
  firebase: {
    color: '#FFCA28', // Firebase yellow
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  note: {
    fontSize: 10,
    textAlign: 'center',
    color: theme.colors.gray[500],
    marginTop: 4,
  },
  statusIndicator: {
    marginRight: 5,
  },
  errorText: {
    fontSize: 12,
    marginRight: 5,
    color: theme.colors.danger,
  },
  errorCount: {
    fontSize: 9,
    marginRight: 5,
    color: theme.colors.danger,
    backgroundColor: theme.colors.gray[200],
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 10,
    overflow: 'hidden',
  }
});