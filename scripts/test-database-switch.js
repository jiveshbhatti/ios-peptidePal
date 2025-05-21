/**
 * Test Database Switching Logic
 * 
 * This script tests the database switching logic between Supabase and Firebase
 * by creating a local test environment that simulates the DatabaseContext.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const { Platform } = require('react-native');

// Mock AsyncStorage if needed
if (!AsyncStorage.getItem) {
  const mockStorage = {};
  AsyncStorage.getItem = jest.fn().mockImplementation(key => Promise.resolve(mockStorage[key]));
  AsyncStorage.setItem = jest.fn().mockImplementation((key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  });
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com",
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

console.log('DATABASE SWITCH TEST');
console.log('====================');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock Peptide Service (simplified version of what's in the app)
const peptideService = {
  getPeptides: async () => {
    console.log('Using Supabase getPeptides()');
    return [{ id: 'mock-peptide-1', name: 'Mock Supabase Peptide' }];
  },
  
  getPeptideById: async (id) => {
    console.log(`Using Supabase getPeptideById(${id})`);
    return { id, name: 'Mock Supabase Peptide' };
  },
  
  addDoseLog: async (peptideId, dose) => {
    console.log(`Using Supabase addDoseLog for peptide ${peptideId}`);
    return true;
  },
  
  getInventoryPeptides: async () => {
    console.log('Using Supabase getInventoryPeptides()');
    return [{ id: 'mock-inventory-1', name: 'Mock Supabase Inventory Peptide' }];
  }
};

// Mock Firebase Service (simplified version of what's in the app)
const firebaseService = {
  getPeptides: async () => {
    console.log('Using Firebase getPeptides()');
    try {
      const snapshot = await getDocs(collection(db, 'peptides'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching peptides from Firebase:', error);
      return [];
    }
  },
  
  getPeptideById: async (id) => {
    console.log(`Using Firebase getPeptideById(${id})`);
    return { id, name: 'Mock Firebase Peptide' };
  },
  
  addDoseLog: async (peptideId, dose) => {
    console.log(`Using Firebase addDoseLog for peptide ${peptideId}`);
    return true;
  },
  
  getInventoryPeptides: async () => {
    console.log('Using Firebase getInventoryPeptides()');
    try {
      const snapshot = await getDocs(collection(db, 'inventory_peptides'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching inventory peptides from Firebase:', error);
      return [];
    }
  }
};

// Simplified version of the DatabaseContext logic
class MockDatabaseContext {
  constructor() {
    this.useFirebase = false;
    this.connectionStatus = 'disconnected';
    this.errorCount = 0;
    this.hasTestedFirebase = false;
  }
  
  async initialize() {
    // Load preference from storage
    try {
      const preference = await AsyncStorage.getItem('peptidepal_db_preference');
      if (preference === 'firebase') {
        this.useFirebase = true;
        this.connectionStatus = 'connected';
      }
      
      const tested = await AsyncStorage.getItem('has_tested_firebase');
      this.hasTestedFirebase = tested === 'true';
      
      console.log(`Initialized with useFirebase=${this.useFirebase}, hasTestedFirebase=${this.hasTestedFirebase}`);
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
  }
  
  get service() {
    return this.useFirebase ? firebaseService : peptideService;
  }
  
  async toggleDatabase() {
    // Toggle database preference
    const newValue = !this.useFirebase;
    
    // If switching to Firebase, test connection first
    if (newValue) {
      this.connectionStatus = 'connecting';
      console.log('Testing Firebase connection...');
      
      try {
        // Simple connection test
        const snapshot = await getDocs(collection(db, 'peptides'));
        console.log(`Found ${snapshot.docs.length} peptides in Firebase`);
        
        // Update state
        this.useFirebase = true;
        this.connectionStatus = 'connected';
        this.hasTestedFirebase = true;
        
        // Save preferences
        await AsyncStorage.setItem('peptidepal_db_preference', 'firebase');
        await AsyncStorage.setItem('has_tested_firebase', 'true');
        
        console.log('Successfully switched to Firebase');
      } catch (error) {
        console.error('Error connecting to Firebase:', error);
        this.connectionStatus = 'error';
        console.log('Failed to switch to Firebase due to connection error');
        return false;
      }
    } else {
      // Switching to Supabase is simpler
      this.useFirebase = false;
      this.connectionStatus = 'connected';
      await AsyncStorage.setItem('peptidepal_db_preference', 'supabase');
      console.log('Successfully switched to Supabase');
    }
    
    return true;
  }
  
  async testDatabaseOperations() {
    try {
      console.log(`\nTesting database operations with ${this.useFirebase ? 'Firebase' : 'Supabase'}...`);
      
      console.log('\n1. Testing getPeptides()');
      const peptides = await this.service.getPeptides();
      console.log(`Retrieved ${peptides.length} peptides`);
      
      console.log('\n2. Testing getInventoryPeptides()');
      const inventoryPeptides = await this.service.getInventoryPeptides();
      console.log(`Retrieved ${inventoryPeptides.length} inventory peptides`);
      
      console.log('\nAll database operations completed successfully!');
      return true;
    } catch (error) {
      console.error('Error testing database operations:', error);
      return false;
    }
  }
  
  async resetFirebaseConnection() {
    if (this.useFirebase) {
      console.log('Resetting Firebase connection...');
      this.errorCount = 0;
      this.connectionStatus = 'connected';
      return true;
    }
    return false;
  }
  
  handleTransportError() {
    if (this.useFirebase) {
      this.errorCount++;
      console.log(`Transport error detected (count: ${this.errorCount})`);
      
      if (this.errorCount >= 3) {
        this.connectionStatus = 'error';
      }
    }
  }
}

// Main test function
async function runTest() {
  try {
    console.log('Starting database switch test...');
    
    // Create context
    const dbContext = new MockDatabaseContext();
    await dbContext.initialize();
    
    // Test initial state database operations
    console.log(`\nINITIAL STATE: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
    await dbContext.testDatabaseOperations();
    
    // Toggle database
    console.log('\nTOGGLING DATABASE...');
    const toggleResult = await dbContext.toggleDatabase();
    console.log(`Toggle result: ${toggleResult ? 'Success' : 'Failed'}`);
    
    // Test after toggle
    console.log(`\nAFTER TOGGLE: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
    await dbContext.testDatabaseOperations();
    
    // Test error handling
    if (dbContext.useFirebase) {
      console.log('\nTESTING ERROR HANDLING:');
      console.log('Simulating 3 transport errors...');
      
      // Simulate errors
      for (let i = 0; i < 3; i++) {
        dbContext.handleTransportError();
      }
      
      console.log(`Error count: ${dbContext.errorCount}`);
      console.log(`Connection status: ${dbContext.connectionStatus}`);
      
      // Test reset
      console.log('\nTesting connection reset...');
      const resetResult = await dbContext.resetFirebaseConnection();
      console.log(`Reset result: ${resetResult ? 'Success' : 'Failed'}`);
      console.log(`Error count after reset: ${dbContext.errorCount}`);
      console.log(`Connection status after reset: ${dbContext.connectionStatus}`);
    }
    
    // Toggle back
    console.log('\nTOGGLING BACK...');
    await dbContext.toggleDatabase();
    console.log(`Final state: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
    
    console.log('\nDATABASE SWITCH TEST COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();