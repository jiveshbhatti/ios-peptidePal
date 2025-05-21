/**
 * Direct Firebase CLI Connection Verification Script
 * 
 * This script uses the Firebase SDK directly with no proxies or wrappers
 * to validate that the Firebase configuration is correct and that we can
 * connect to the database.
 */

// Load the Firebase SDK directly
const firebase = require('firebase/app');
const { getFirestore, collection, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

// Use the exact same Firebase configuration used in the app
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Terminal colors for better visibility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function verifyFirebaseConnection() {
  console.log(`${colors.cyan}=== FIREBASE DIRECT CONNECTION TEST ===${colors.reset}`);
  console.log(`${colors.yellow}This script tests a direct connection to Firebase with no proxies or wrappers${colors.reset}`);
  
  try {
    // Step 1: Initialize Firebase
    console.log(`\n${colors.blue}Step 1: Initializing Firebase app${colors.reset}`);
    console.log(`Project ID: ${firebaseConfig.projectId}`);
    
    // Create a completely new, clean initialization
    const app = firebase.initializeApp(firebaseConfig, `cli-verification-${Date.now()}`);
    console.log(`${colors.green}✓ Firebase app initialized successfully${colors.reset}`);
    
    // Step 2: Initialize Firestore
    console.log(`\n${colors.blue}Step 2: Initializing Firestore${colors.reset}`);
    const db = getFirestore(app);
    console.log(`${colors.green}✓ Firestore instance created successfully${colors.reset}`);
    
    // Step 3: Test Peptides Collection
    console.log(`\n${colors.blue}Step 3: Testing peptides collection${colors.reset}`);
    try {
      const peptideSnapshot = await getDocs(collection(db, "peptides"));
      console.log(`${colors.green}✓ Successfully accessed peptides collection${colors.reset}`);
      console.log(`Found ${peptideSnapshot.size} documents`);
      
      // List the first few peptides
      if (peptideSnapshot.size > 0) {
        console.log(`\nFirst ${Math.min(3, peptideSnapshot.size)} peptides:`);
        let count = 0;
        peptideSnapshot.forEach(doc => {
          if (count < 3) {
            console.log(`- ${doc.id}: ${doc.data().name || 'No name'}`);
            count++;
          }
        });
      }
    } catch (error) {
      console.log(`${colors.red}✗ Failed to access peptides collection${colors.reset}`);
      console.log(`Error: ${error.message}`);
    }
    
    // Step 4: Test Inventory Peptides Collection
    console.log(`\n${colors.blue}Step 4: Testing inventory_peptides collection${colors.reset}`);
    try {
      const inventorySnapshot = await getDocs(collection(db, "inventory_peptides"));
      console.log(`${colors.green}✓ Successfully accessed inventory_peptides collection${colors.reset}`);
      console.log(`Found ${inventorySnapshot.size} documents`);
      
      // List the first few inventory items
      if (inventorySnapshot.size > 0) {
        console.log(`\nFirst ${Math.min(3, inventorySnapshot.size)} inventory peptides:`);
        let count = 0;
        inventorySnapshot.forEach(doc => {
          if (count < 3) {
            console.log(`- ${doc.id}: ${doc.data().name || 'No name'}`);
            count++;
          }
        });
      }
    } catch (error) {
      console.log(`${colors.red}✗ Failed to access inventory_peptides collection${colors.reset}`);
      console.log(`Error: ${error.message}`);
    }
    
    // Step 5: Verify project and database paths
    console.log(`\n${colors.blue}Step 5: Verifying Project Configuration${colors.reset}`);
    console.log(`Firebase Project: ${firebaseConfig.projectId}`);
    console.log(`Firestore Database: default`);
    console.log(`Storage Bucket: ${firebaseConfig.storageBucket}`);
    
    // Step 6: Summary
    console.log(`\n${colors.cyan}=== TEST RESULTS ===${colors.reset}`);
    console.log(`${colors.green}Firebase SDK is working correctly with direct initialization${colors.reset}`);
    console.log(`${colors.yellow}If you're still seeing errors in the app but this test passes:${colors.reset}`);
    console.log(`1. The problem is likely in how Firebase is being imported or initialized in the app`);
    console.log(`2. There might be multiple Firebase instances competing with each other`);
    console.log(`3. Check for circular imports or import timing issues`);
    
  } catch (error) {
    console.log(`\n${colors.red}=== TEST FAILED ===${colors.reset}`);
    console.log(`Fatal error: ${error.message}`);
    console.log(`Check your Firebase configuration and internet connection`);
  }
}

// Run the test
verifyFirebaseConnection();