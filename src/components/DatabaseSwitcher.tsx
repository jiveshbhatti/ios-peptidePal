import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useDatabase } from '@/contexts/DatabaseContext';
import { theme } from '@/constants/theme';

export default function DatabaseSwitcher() {
  const { useFirebase, toggleDatabase } = useDatabase();

  return (
    <View style={styles.container}>
      <View style={styles.switcherContainer}>
        <Text style={styles.label}>Database:</Text>
        <Text style={[
          styles.source, 
          useFirebase ? styles.firebase : styles.supabase
        ]}>
          {useFirebase ? 'Firebase' : 'Supabase'}
        </Text>
        <Switch
          value={useFirebase}
          onValueChange={toggleDatabase}
          trackColor={{ false: '#767577', true: '#4285F4' }}
          thumbColor={useFirebase ? '#FFFFFF' : '#FFFFFF'}
          ios_backgroundColor="#767577"
          style={styles.switch}
        />
      </View>
      <Text style={styles.note}>
        {useFirebase 
          ? 'Using Firebase (NoSQL)' 
          : 'Using Supabase (PostgreSQL)'}
      </Text>
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
  }
});