import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from '@/navigation/TabNavigator';
import { DataProvider } from '@/contexts/DataContext';
import { supabase } from '@/services/supabase';
import { theme } from '@/constants/theme';

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');

  // Check supabase connection
  useEffect(() => {
    async function checkConnection() {
      try {
        setMessage('Connecting to database...');
        
        // Ping Supabase to check connection
        const { data, error } = await supabase.from('peptides').select('id').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setIsConnected(false);
          setMessage('Could not connect to the database. Please check your connection.');
        } else {
          console.log('Supabase connected successfully');
          setIsConnected(true);
        }
      } catch (err) {
        console.error('App initialization error:', err);
        setIsConnected(false);
        setMessage('Error initializing app. Please restart.');
      }
    }

    checkConnection();
  }, []);

  // Show loading screen while checking connection
  if (isConnected === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show error screen if connection fails
  if (isConnected === false) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{message}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Main app with navigation
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <DataProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

// Styles removed as they're no longer needed