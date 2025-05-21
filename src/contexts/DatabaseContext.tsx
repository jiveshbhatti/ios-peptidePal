import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { peptideService } from '@/services/peptide.service';
import firebaseService from '@/services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define our database service interface
export interface DatabaseService {
  getPeptides: typeof peptideService.getPeptides;
  getPeptideById: typeof peptideService.getPeptideById;
  addDoseLog: typeof peptideService.addDoseLog;
  getInventoryPeptides: () => Promise<any[]>;
  // Add more methods as needed
}

// Create a context with a default value
const DatabaseContext = createContext<{
  service: DatabaseService;
  useFirebase: boolean;
  toggleDatabase: () => void;
}>({
  service: peptideService as DatabaseService,
  useFirebase: false,
  toggleDatabase: () => {},
});

// Storage key for database preference
const DB_PREFERENCE_KEY = 'peptidepal_db_preference';

// Provider component
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [useFirebase, setUseFirebase] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load database preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await AsyncStorage.getItem(DB_PREFERENCE_KEY);
        if (preference !== null) {
          setUseFirebase(preference === 'firebase');
        }
        setIsLoaded(true);
      } catch (e) {
        console.error('Error loading database preference:', e);
        setIsLoaded(true);
      }
    };

    loadPreference();
  }, []);

  // Toggle between Firebase and Supabase
  const toggleDatabase = async () => {
    const newValue = !useFirebase;
    setUseFirebase(newValue);
    
    try {
      await AsyncStorage.setItem(DB_PREFERENCE_KEY, newValue ? 'firebase' : 'supabase');
    } catch (e) {
      console.error('Error saving database preference:', e);
    }
  };

  // Select the appropriate service
  const service = useFirebase ? firebaseService : peptideService as DatabaseService;

  // Don't render children until preferences are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <DatabaseContext.Provider value={{ service, useFirebase, toggleDatabase }}>
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