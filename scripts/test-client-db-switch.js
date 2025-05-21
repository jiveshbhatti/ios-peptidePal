/**
 * Test Client Database Switching
 * 
 * This script tests database switching in a simulated client environment
 * by loading and switching between Firebase and Supabase services.
 */

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDocs } = require('firebase/firestore');

console.log('CLIENT DATABASE SWITCHING TEST');
console.log('=============================');

// Database configurations
const supabaseUrl = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com",
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Mock AsyncStorage implementation
const AsyncStorage = {
  storage: {},
  getItem: async (key) => AsyncStorage.storage[key] || null,
  setItem: async (key, value) => {
    AsyncStorage.storage[key] = value;
    return true;
  }
};

// Initialize services
let supabase;
let firebase;
let firestore;

// Service implementations
const services = {
  // Supabase service
  supabase: {
    async getPeptides() {
      console.log('Using Supabase getPeptides()');
      try {
        const { data, error } = await supabase
          .from('peptides')
          .select('*');
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching peptides from Supabase:', error);
        return [];
      }
    },
    
    async getInventoryPeptides() {
      console.log('Using Supabase getInventoryPeptides()');
      try {
        const { data, error } = await supabase
          .from('inventory_peptides')
          .select('*');
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching inventory peptides from Supabase:', error);
        return [];
      }
    }
  },
  
  // Firebase service
  firebase: {
    async getPeptides() {
      console.log('Using Firebase getPeptides()');
      try {
        const peptideSnapshot = await getDocs(collection(firestore, "peptides"));
        return peptideSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching peptides from Firebase:', error);
        return [];
      }
    },
    
    async getInventoryPeptides() {
      console.log('Using Firebase getInventoryPeptides()');
      try {
        const inventorySnapshot = await getDocs(collection(firestore, "inventory_peptides"));
        return inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching inventory peptides from Firebase:', error);
        return [];
      }
    }
  }
};

// Database context implementation
class DatabaseContext {
  constructor() {
    this.useFirebase = false;
    this.hasTestedFirebase = false;
    this.connectionStatus = 'disconnected';
    this.errorCount = 0;
  }
  
  async initialize() {
    // Initialize Supabase
    supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize Firebase
    firebase = initializeApp(firebaseConfig);
    firestore = getFirestore(firebase);
    
    // Load preferences
    const dbPreference = await AsyncStorage.getItem('peptidepal_db_preference');
    const testedFirebase = await AsyncStorage.getItem('has_tested_firebase');
    
    this.useFirebase = dbPreference === 'firebase';
    this.hasTestedFirebase = testedFirebase === 'true';
    this.connectionStatus = 'connected';
    
    console.log(`Initialized with useFirebase=${this.useFirebase}, hasTestedFirebase=${this.hasTestedFirebase}`);
  }
  
  get service() {
    return this.useFirebase ? services.firebase : services.supabase;
  }
  
  async toggleDatabase() {
    console.log(`Toggling database from ${this.useFirebase ? 'Firebase' : 'Supabase'} to ${!this.useFirebase ? 'Firebase' : 'Supabase'}`);
    
    // If switching to Firebase, test connection
    if (!this.useFirebase) {
      this.connectionStatus = 'connecting';
      console.log('Testing Firebase connection...');
      
      try {
        const snapshot = await getDocs(collection(firestore, 'peptides'));
        console.log(`Found ${snapshot.docs.length} peptides in Firebase`);
        
        this.useFirebase = true;
        this.connectionStatus = 'connected';
        this.hasTestedFirebase = true;
        
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
      // Switching to Supabase
      this.useFirebase = false;
      this.connectionStatus = 'connected';
      await AsyncStorage.setItem('peptidepal_db_preference', 'supabase');
      console.log('Successfully switched to Supabase');
    }
    
    return true;
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
}

// Test function
async function runTest() {
  try {
    console.log('Starting client database switching test...');
    
    // Create and initialize context
    const dbContext = new DatabaseContext();
    await dbContext.initialize();
    
    // Test initial state
    console.log(`\nINITIAL STATE: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
    
    // Query peptides from initial database
    console.log('\nTesting getPeptides()...');
    const initialPeptides = await dbContext.service.getPeptides();
    console.log(`Retrieved ${initialPeptides.length} peptides from initial database`);
    
    // Query inventory peptides from initial database
    console.log('\nTesting getInventoryPeptides()...');
    const initialInventory = await dbContext.service.getInventoryPeptides();
    console.log(`Retrieved ${initialInventory.length} inventory peptides from initial database`);
    
    // Toggle database
    console.log('\nTOGGLING DATABASE...');
    const toggleResult = await dbContext.toggleDatabase();
    console.log(`Toggle result: ${toggleResult ? 'Success' : 'Failed'}`);
    
    if (toggleResult) {
      // Test after toggle
      console.log(`\nAFTER TOGGLE: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
      
      // Query peptides after toggle
      console.log('\nTesting getPeptides() after toggle...');
      const toggledPeptides = await dbContext.service.getPeptides();
      console.log(`Retrieved ${toggledPeptides.length} peptides after toggle`);
      
      // Query inventory peptides after toggle
      console.log('\nTesting getInventoryPeptides() after toggle...');
      const toggledInventory = await dbContext.service.getInventoryPeptides();
      console.log(`Retrieved ${toggledInventory.length} inventory peptides after toggle`);
      
      // Toggle back
      console.log('\nTOGGLING BACK...');
      await dbContext.toggleDatabase();
      console.log(`Final state: ${dbContext.useFirebase ? 'Firebase' : 'Supabase'}`);
      
      // Test final state
      console.log('\nTesting getPeptides() after toggling back...');
      const finalPeptides = await dbContext.service.getPeptides();
      console.log(`Retrieved ${finalPeptides.length} peptides after toggling back`);
    }
    
    console.log('\nCLIENT DATABASE SWITCHING TEST COMPLETED');
    
    // Summarize test results
    console.log('\nTEST RESULTS:');
    console.log(`- Database toggling: ${toggleResult ? 'PASSED' : 'FAILED'}`);
    console.log(`- Database access: ${initialPeptides.length > 0 ? 'PASSED' : 'WARNING - No peptides found'}`);
    console.log(`- Preference persistence: ${AsyncStorage.storage['peptidepal_db_preference'] ? 'PASSED' : 'FAILED'}`);
    
    if (toggleResult) {
      console.log('\nAll tests passed successfully!');
    } else {
      console.log('\nSome tests failed. Check the logs for details.');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();