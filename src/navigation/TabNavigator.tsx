import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Icon from 'react-native-feather';
import { theme } from '@/constants/theme';

// Screen imports
import HomeScreen from '@/screens/HomeScreen';
import InventoryScreen from '@/screens/InventoryScreen';
import CalculatorScreen from '@/screens/CalculatorScreen';
import SummaryScreen from '@/screens/SummaryScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray[400],
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.gray[100],
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.gray[100],
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: '600',
        },
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