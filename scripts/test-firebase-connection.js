/**
 * Test script for Firebase connection issues
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  getDocs,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function testFirebaseConnection() {
  try {
    console.log('🔶 Starting Firebase connection test...');
    console.log('🔶 Initializing Firebase with better connection settings');
    
    // Initialize Firebase with better connection settings
    const app = initializeApp(firebaseConfig);
    
    // Try to get existing Firestore instance first
    let db;
    try {
      console.log('🔶 Getting existing Firestore instance...');
      db = getFirestore(app);
      console.log('🔶 Got existing Firestore instance');
    } catch (getFirestoreError) {
      console.log('🔶 Could not get existing Firestore instance, creating new one...');
      
      // Use more robust settings (offline-first)
      db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true, // Always use long polling
        ignoreUndefinedProperties: true, // More forgiving document handling
        useFetchStreams: false // Avoid stream-based fetching
      });
      console.log('🔶 Created new Firestore instance');
    }
    
    console.log('🔶 Firebase initialized, trying to reset connection...');
    
    // Connection reset procedure
    try {
      console.log('🔶 Disabling network...');
      await disableNetwork(db);
      console.log('🔶 Network disabled.');
      
      console.log('🔶 Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔶 Re-enabling network...');
      await enableNetwork(db);
      console.log('🔶 Network re-enabled.');
    } catch (connError) {
      console.error('Error during connection reset:', connError);
    }
    
    console.log('🔶 Trying a simple read operation from "peptides" collection...');
    
    // Read operation
    try {
      const snapshot = await getDocs(collection(db, 'peptides'));
      console.log('🔶 Successfully read from Firebase!');
      console.log(`🔶 Found ${snapshot.docs.length} documents in "peptides" collection`);
      
      snapshot.docs.forEach((doc, index) => {
        if (index < 3) { // Only show first 3 to avoid clutter
          console.log(`     - ${doc.id}: ${doc.data().name || '(no name)'}`);
        }
      });
      
      if (snapshot.docs.length > 3) {
        console.log(`     - ... and ${snapshot.docs.length - 3} more`);
      }
      
      return true;
    } catch (readError) {
      console.error('Read operation failed:', readError);
      return false;
    }
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

// Run the test
console.log('🔶 FIREBASE CONNECTION TEST');
console.log('🔶 This script tests reading from Firebase to ensure connectivity');
console.log('🔶 It uses improved connection settings to overcome common issues');

testFirebaseConnection().then(success => {
  console.log('\n🔶 Test Result:', success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('🔶 Test completed');
});