import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { peptideService } from '@/services/peptide.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Import the Firebase clean service with completely fresh implementation
import firebaseCleanService, { firestoreDbClean } from '@/services/firebase-clean';

// Enable App Check debug token for development
if (typeof self !== 'undefined') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Define our database service interface
export interface DatabaseService {
  getPeptides: typeof peptideService.getPeptides;
  getPeptideById: typeof peptideService.getPeptideById;
  addDoseLog: typeof peptideService.addDoseLog;
  removeDoseLog?: (peptideId: string, doseLogId: string) => Promise<any>;
  getInventoryPeptides: () => Promise<any[]>;
  getInventoryBacWater?: () => Promise<any[]>;
  getInventorySyringes?: () => Promise<any[]>;
  getInventoryOtherItems?: () => Promise<any[]>;
  // Add more methods as needed
}

// Create a context with a default value
const DatabaseContext = createContext<{
  service: DatabaseService;
  useFirebase: boolean;
  hasTestedFirebase: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  errorCount: number;
  toggleDatabase: () => void;
  resetFirebaseConnection: () => Promise<boolean>;
  handleTransportError: () => void;
}>({
  service: peptideService as DatabaseService,
  useFirebase: false,
  hasTestedFirebase: false,
  connectionStatus: 'disconnected',
  errorCount: 0,
  toggleDatabase: () => {},
  resetFirebaseConnection: async () => false,
  handleTransportError: () => {},
});

// Storage key for database preference
const DB_PREFERENCE_KEY = 'peptidepal_db_preference';

// Provider component
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [useFirebase, setUseFirebase] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasTestedFirebase, setHasTestedFirebase] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [errorCount, setErrorCount] = useState<number>(0);

  // Enable Firebase App Check debug token for the component
  useEffect(() => {
    // Set debug token for App Check to work in development
    if (Platform.OS === 'web' && typeof self !== 'undefined') {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    } else if (typeof global !== 'undefined') {
      global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
  }, []);

  // Load database preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        // Load database preference
        const preference = await AsyncStorage.getItem(DB_PREFERENCE_KEY);
        if (preference !== null) {
          setUseFirebase(preference === 'firebase');
        }
        
        // Load whether user has tested Firebase before
        const testedFirebase = await AsyncStorage.getItem('has_tested_firebase');
        if (testedFirebase === 'true') {
          setHasTestedFirebase(true);
        }
        
        setIsLoaded(true);
      } catch (e) {
        console.error('Error loading preferences:', e);
        setIsLoaded(true);
      }
    };

    loadPreference();
  }, []);

  // Function to handle transport errors from Firebase
  const handleTransportError = () => {
    if (!useFirebase) return; // Only handle errors when Firebase is active
    
    // Increment error count
    setErrorCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Firebase transport error ${newCount} detected`);
      
      // If we're seeing errors, update the connection status
      if (newCount >= 3) {
        setConnectionStatus('error');
      }
      
      // Use the global handler if available (from firebase.ts)
      if (global.handleFirebaseNetworkError) {
        global.handleFirebaseNetworkError();
      }
      
      return newCount;
    });
  };
  
  // Function to explicitly reset Firebase connection
  const resetFirebaseConnection = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      try {
        setConnectionStatus('connecting');
        setErrorCount(0); // Reset error count
        
        // Try using global handler first if available
        if (global.handleFirebaseNetworkError) {
          global.handleFirebaseNetworkError();
          
          console.log('Firebase connection reset via global handler');
          setConnectionStatus('connected');
          return true;
        } else {
          // Use the clean Firestore instance
          // Try to reset the connection by toggling network
          await disableNetwork(firestoreDbClean);
          await new Promise(resolve => setTimeout(resolve, 1500));
          await enableNetwork(firestoreDbClean);
          
          console.log('Firebase connection reset successfully');
          setConnectionStatus('connected');
          return true;
        }
      } catch (err) {
        console.error('Error resetting Firebase connection:', err);
        setConnectionStatus('error');
        return false;
      }
    }
    return false;
  };

  // Toggle between Firebase and Supabase
  const toggleDatabase = async () => {
    // Ensure App Check debug token is set
    if (Platform.OS === 'web' && typeof self !== 'undefined') {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    } else if (typeof global !== 'undefined') {
      global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const newValue = !useFirebase;
    
    // If switching to Firebase, first check the connection
    if (newValue) {
      setConnectionStatus('connecting');
      
      // Warn user when switching to Firebase if no data has been migrated
      if (!hasTestedFirebase) {
        Alert.alert(
          'Switching to Firebase',
          'This will use the Firebase database instead of Supabase. If you haven\'t migrated your data yet, you may not see any peptides. Continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setConnectionStatus('disconnected')
            },
            {
              text: 'Switch Anyway',
              onPress: async () => {
                try {
                  const connectionOk = await resetFirebaseConnection();
                  
                  if (connectionOk) {
                    setUseFirebase(true);
                    await AsyncStorage.setItem(DB_PREFERENCE_KEY, 'firebase');
                    setHasTestedFirebase(true);
                    await AsyncStorage.setItem('has_tested_firebase', 'true');
                  } else {
                    Alert.alert(
                      'Connection Error',
                      'Could not connect to Firebase. Please check your network connection and try again.',
                      [{ text: 'OK' }]
                    );
                    setConnectionStatus('error');
                  }
                } catch (e) {
                  console.error('Error saving database preference:', e);
                  setConnectionStatus('error');
                }
              }
            }
          ]
        );
        return;
      } else {
        // Already tested Firebase before, just check connection
        try {
          const connectionOk = await resetFirebaseConnection();
          if (!connectionOk) {
            Alert.alert(
              'Connection Warning',
              'Firebase connection is unreliable. You may experience issues with the app.',
              [
                { 
                  text: 'Cancel Switch', 
                  style: 'cancel',
                  onPress: () => setConnectionStatus('disconnected')
                },
                { 
                  text: 'Continue Anyway',
                  onPress: async () => {
                    setUseFirebase(true);
                    await AsyncStorage.setItem(DB_PREFERENCE_KEY, 'firebase');
                  }
                }
              ]
            );
            return;
          }
        } catch (e) {
          console.error('Error checking Firebase connection:', e);
        }
      }
    } else {
      // Switching to Supabase
      setConnectionStatus('connected');
    }
    
    // Normal toggle (going from Firebase to Supabase or already tested Firebase)
    setUseFirebase(newValue);
    
    try {
      await AsyncStorage.setItem(DB_PREFERENCE_KEY, newValue ? 'firebase' : 'supabase');
    } catch (e) {
      console.error('Error saving database preference:', e);
    }
  };

  // Monitor for Firebase errors - always call this hook but only apply the logic when Firebase is active
  useEffect(() => {
    // Skip actual monitoring if not using Firebase
    if (!useFirebase) return;
    
    // Create an error listener for transport errors
    const errorListener = () => {
      console.log('Detected Firebase transport error event');
      handleTransportError();
    };
    
    // Set up global error monitoring
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      // Check for Firebase transport errors in warnings
      const warnMessage = args.join(' ');
      if (
        warnMessage.includes('@firebase/firestore') && 
        warnMessage.includes('transport errored')
      ) {
        // Call our transport error handler
        errorListener();
      }
      // Pass through to the original console.warn
      originalConsoleWarn.apply(console, args);
    };
    
    // Cleanup function
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, [useFirebase, handleTransportError]);

  // Select the appropriate service
  const service = useFirebase ? firebaseCleanService : peptideService as DatabaseService;
  
  // Debug log for database switching
  useEffect(() => {
    console.log(`DatabaseContext: Using ${useFirebase ? 'Firebase (CLEAN)' : 'Supabase'} database service`);
    
    if (useFirebase) {
      // Verify the service is properly initialized
      const verifyService = async () => {
        try {
          console.log('Verifying Firebase service (clean implementation)...');
          await firebaseCleanService.getInventoryPeptides();
          console.log('Firebase clean service verification successful!');
        } catch (error) {
          console.error('Firebase clean service verification failed:', error);
        }
      };
      
      verifyService();
    }
  }, [useFirebase]);

  // Don't render children until preferences are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <DatabaseContext.Provider value={{ 
      service, 
      useFirebase, 
      toggleDatabase,
      hasTestedFirebase,
      connectionStatus,
      errorCount,
      resetFirebaseConnection,
      handleTransportError
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Custom hook to use the database service
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};