import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import PeptideDetailsScreen from '@/screens/PeptideDetailsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MetricsDetailScreen from '@/screens/MetricsDetailScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import AddMetricScreen from '@/screens/AddMetricScreen';
import { theme } from '@/constants/theme';

export type RootStackParamList = {
  Main: { screen?: string };
  PeptideDetails: { peptideId: string };
  Profile: undefined;
  MetricsDetail: { type: 'weight' | 'measurements' | 'photos' };
  EditProfile: undefined;
  AddMetric: { type: 'weight' | 'measurement' };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.colors.gray[900],
        headerTitleStyle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: '600',
        },
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
    </Stack.Navigator>
  );
}