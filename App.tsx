import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { DataProvider } from '@/contexts/DataContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import NotificationService from '@/services/NotificationService';

export default function App() {
  useEffect(() => {
    // Setup notification categories on app start
    NotificationService.setupNotificationCategories();
  }, []);

  // Root navigation structure
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <DataProvider>
            <StatusBar style="auto" />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </DataProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}