import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import PeptideDetailsScreen from '@/screens/PeptideDetailsScreen';
import { theme } from '@/constants/theme';

export type RootStackParamList = {
  Main: { screen?: string };
  PeptideDetails: { peptideId: string };
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
    </Stack.Navigator>
  );
}