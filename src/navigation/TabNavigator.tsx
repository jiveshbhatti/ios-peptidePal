import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Icon from 'react-native-feather';
import { useAppTheme } from '@/hooks/useAppTheme';

// Screen imports
import HomeScreen from '@/screens/HomeScreen';
import InventoryScreen from '@/screens/InventoryScreen';
import CalculatorScreen from '@/screens/CalculatorScreen';
import SummaryScreen from '@/screens/SummaryScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
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
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 12,
          paddingTop: 8,
          height: 72,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: '600',
          color: theme.colors.text,
        },
        // Provide fonts for React Navigation internal components
        fonts,
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