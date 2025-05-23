import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';

// Import the Firebase clean service with completely fresh implementation
import firebaseCleanService from '@/services/firebase-clean';

// Enable App Check debug token for development
if (typeof self !== 'undefined') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Define our database service interface
export interface DatabaseService {
  getPeptides: typeof firebaseCleanService.getPeptides;
  getPeptideById: typeof firebaseCleanService.getPeptideById;
  addDoseLog: typeof firebaseCleanService.addDoseLog;
  removeDoseLog: typeof firebaseCleanService.removeDoseLog;
  getInventoryPeptides: typeof firebaseCleanService.getInventoryPeptides;
  getInventoryBacWater: typeof firebaseCleanService.getInventoryBacWater;
  getInventorySyringes: typeof firebaseCleanService.getInventorySyringes;
  getInventoryOtherItems: typeof firebaseCleanService.getInventoryOtherItems;
  addPeptideToInventory: typeof firebaseCleanService.addPeptideToInventory;
  updatePeptideInInventory: typeof firebaseCleanService.updatePeptideInInventory;
  updatePeptide: typeof firebaseCleanService.updatePeptide;
}

// Create a context with a default value
const DatabaseContext = createContext<{
  service: DatabaseService;
}>({
  service: firebaseCleanService as DatabaseService,
});

// Provider component
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Enable Firebase App Check debug token for the component
  useEffect(() => {
    // Set debug token for App Check to work in development
    if (Platform.OS === 'web' && typeof self !== 'undefined') {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    } else if (typeof global !== 'undefined') {
      global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
  }, []);

  // Debug log for database service
  useEffect(() => {
    console.log('DatabaseContext: Using Firebase database service');
    
    // Verify the service is properly initialized
    const verifyService = async () => {
      try {
        console.log('Verifying Firebase service...');
        await firebaseCleanService.getInventoryPeptides();
        console.log('Firebase service verification successful!');
      } catch (error) {
        console.error('Firebase service verification failed:', error);
      }
    };
    
    verifyService();
  }, []);

  return (
    <DatabaseContext.Provider value={{ 
      service: firebaseCleanService as DatabaseService
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