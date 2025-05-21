/**
 * Test Database Switching Script
 * 
 * This script tests the ability to switch between Firebase and Supabase
 * databases and verifies that the initialization is working correctly.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Mock AsyncStorage and Alert for testing in Node.js
if (typeof AsyncStorage.getItem !== 'function') {
  global.AsyncStorage = {
    getItem: async (key) => {
      console.log(`[Mock] Getting item with key ${key}`);
      return null;
    },
    setItem: async (key, value) => {
      console.log(`[Mock] Setting ${key} to ${value}`);
      return true;
    }
  };
  
  global.Alert = {
    alert: (title, message, buttons) => {
      console.log(`[Mock Alert] ${title}: ${message}`);
      // Simulate clicking the last button (usually confirm)
      if (buttons && buttons.length > 0) {
        const lastButton = buttons[buttons.length - 1];
        if (lastButton.onPress) {
          console.log(`[Mock] Pressing button: ${lastButton.text}`);
          lastButton.onPress();
        }
      }
    }
  };
}

// Import the DatabaseContext (initialize will be called)
import { DatabaseProvider, useDatabase } from '../src/contexts/DatabaseContext';
import React, { useEffect } from 'react';

// Create a test component that uses the DatabaseContext
const TestComponent = () => {
  const { service, useFirebase, toggleDatabase } = useDatabase();
  
  useEffect(() => {
    const runTest = async () => {
      try {
        console.log(`\n--------------------------------------`);
        console.log(`Current database: ${useFirebase ? 'Firebase' : 'Supabase'}`);
        
        // Test accessing peptides from current database
        console.log(`Fetching peptides from ${useFirebase ? 'Firebase' : 'Supabase'}...`);
        const peptides = await service.getPeptides();
        console.log(`Found ${peptides.length} peptides`);
        
        if (peptides.length > 0) {
          console.log(`First peptide name: ${peptides[0].name}`);
        }
        
        // Toggle to the other database
        console.log(`\nSwitching to ${useFirebase ? 'Supabase' : 'Firebase'}...`);
        await toggleDatabase();
      } catch (err) {
        console.error('Test error:', err);
      }
    };
    
    runTest();
  }, [service, useFirebase, toggleDatabase]);
  
  return null;
};

// Initialize the React component to test the database switching
const { createElement } = React;
createElement(DatabaseProvider, {}, createElement(TestComponent));

console.log('Database switching test started. Check the output for results.');