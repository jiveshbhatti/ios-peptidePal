import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Icon from 'react-native-feather';

// Screen imports
import HomeScreen from '@/screens/HomeScreen';
import InventoryScreen from '@/screens/InventoryScreen';
import CalculatorScreen from '@/screens/CalculatorScreen';
import SummaryScreen from '@/screens/SummaryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import PeptideDetailsScreen from '@/screens/PeptideDetailsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MetricsDetailScreen from '@/screens/MetricsDetailScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import AddMetricScreen from '@/screens/AddMetricScreen';
import ProgressPhotosScreen from '@/screens/ProgressPhotosScreen';
import TestInputScreen from '@/screens/TestInputScreen';

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
const Tab = createBottomTabNavigator();

// Static theme values
const THEME = {
  colors: {
    primary: '#008080',
    textTertiary: '#9CA3AF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    text: '#1F2937',
    background: '#FFFFFF',
  },
  typography: {
    fontSize: {
      lg: 17,
    },
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: 'bold' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as const,
    },
  },
};

function StaticTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.border,
          borderTopWidth: 1,
          paddingBottom: 12,
          paddingTop: 8,
          height: 72,
        },
        headerStyle: {
          backgroundColor: THEME.colors.surface,
          borderBottomColor: THEME.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: THEME.colors.text,
        headerTitleStyle: {
          fontSize: THEME.typography.fontSize.lg,
          fontWeight: '600',
          color: THEME.colors.text,
        },
        // Provide fonts for React Navigation internal components
        fonts: THEME.fonts,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Icon.Calendar stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon.Package stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon.Tool stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon.BarChart2 stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon.Settings stroke={color} width={size} height={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function StaticNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: THEME.colors.text,
        headerTitleStyle: {
          fontSize: THEME.typography.fontSize.lg,
          fontWeight: '600',
        },
        // Provide fonts for React Navigation internal components
        fonts: THEME.fonts,
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={StaticTabNavigator} 
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