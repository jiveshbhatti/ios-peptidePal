import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StaticNavigator from '@/navigation/StaticNavigator';
import { DataProvider } from '@/contexts/DataContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
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
        <ThemeProvider>
          <DatabaseProvider>
            <DataProvider>
              <ThemedApp />
            </DataProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Separate component to use theme context
function ThemedApp() {
  const { theme, isDark } = useAppTheme();
  
  // Create a safe navigation theme with fonts
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    fonts: {
      regular: theme.typography.fontFamily.regular,
      medium: theme.typography.fontFamily.medium,
      bold: theme.typography.fontFamily.bold,
      heavy: theme.typography.fontFamily.bold,
    },
  };
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <StaticNavigator />
      </NavigationContainer>
    </>
  );
}