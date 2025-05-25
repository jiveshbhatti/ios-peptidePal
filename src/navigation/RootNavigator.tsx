import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import PeptideDetailsScreen from '@/screens/PeptideDetailsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MetricsDetailScreen from '@/screens/MetricsDetailScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import AddMetricScreen from '@/screens/AddMetricScreen';
import ProgressPhotosScreen from '@/screens/ProgressPhotosScreen';
import { useAppTheme } from '@/hooks/useAppTheme';

export type RootStackParamList = {
  Main: { screen?: string };
  PeptideDetails: { peptideId: string };
  Profile: undefined;
  MetricsDetail: { type: 'weight' | 'measurements' | 'photos' };
  EditProfile: undefined;
  AddMetric: { type: 'weight' | 'measurement' };
  ProgressPhotos: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useAppTheme();
  
  // Create fonts object for React Navigation
  const fonts = {
    regular: {
      fontFamily: theme.typography.fontFamily.regular,
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: 'bold' as const,
    },
    heavy: {
      fontFamily: theme.typography.fontFamily.bold,
      fontWeight: '900' as const,
    },
  };
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: '600',
        },
        // Provide fonts for React Navigation internal components
        fonts,
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PeptideDetails" 
        component={PeptideDetailsScreen}
        options={{ 
          title: 'Peptide Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="MetricsDetail" 
        component={MetricsDetailScreen}
        options={{ 
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerBackTitle: 'Cancel',
        }}
      />
      <Stack.Screen 
        name="AddMetric" 
        component={AddMetricScreen}
        options={{ 
          title: 'Add Entry',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ProgressPhotos" 
        component={ProgressPhotosScreen}
        options={{ 
          title: 'Progress Photos',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}