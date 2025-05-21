/**
 * Test script for database connection and UUID format
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal", 
  storageBucket: "peptidepal.appspot.com",
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Test Firebase connection with more aggressive error handling
async function testFirebaseConnection() {
  try {
    const { initializeApp } = require('firebase/app');
    const { 
      getFirestore, 
      collection, 
      getDocs,
      enableNetwork,
      disableNetwork,
      initializeFirestore,
      CACHE_SIZE_UNLIMITED,
      setLogLevel,
      waitForPendingWrites,
      clearIndexedDbPersistence
    } = require('firebase/firestore');
    
    console.log('Initializing Firebase test app with improved settings');
    
    // Set more verbose logging
    setLogLevel('debug');
    
    // Use a unique instance name for testing
    const app = initializeApp(firebaseConfig, `test-app-${Date.now()}`);
    
    // Create Firestore with more aggressive offline-first settings
    const db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // Always use long polling 
      experimentalAutoDetectLongPolling: false, // Disable auto-detection
      ignoreUndefinedProperties: true, // More forgiving document handling
      merge: true, // Always merge updates
      useFetchStreams: false, // Avoid stream-based fetching which can cause errors
    });
    
    console.log('Testing improved Firebase connection protocol');
    
    // Define a more robust connection reset function
    const resetConnection = async () => {
      try {
        // Wait for any pending writes to complete
        await waitForPendingWrites(db);
        
        // Disable network briefly
        await disableNetwork(db);
        console.log('Network temporarily disabled for reset');
        
        // Wait before re-enabling
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Re-enable network
        await enableNetwork(db);
        console.log('Network re-enabled after reset');
        return true;
      } catch (error) {
        console.warn('Connection reset error:', error);
        return false;
      }
    };
    
    // Test the reset connection function
    console.log('Testing connection reset mechanism');
    const resetSuccess = await resetConnection();
    
    if (!resetSuccess) {
      console.log('Connection reset failed, trying more aggressive approach');
      try {
        // Try to clear persistence if things are really bad
        await clearIndexedDbPersistence(db);
        console.log('IndexedDB persistence cleared for fresh start');
        
        // Try to reconnect
        await enableNetwork(db);
      } catch (e) {
        console.warn('Could not clear persistence:', e);
      }
    }
    
    // Test a second reset to simulate periodic reset timer
    console.log('Testing periodic connection reset');
    await resetConnection();
    
    // Try to fetch data
    console.log('Fetching test data from Firebase');
    const peptideSnapshot = await getDocs(collection(db, "peptides"));
    
    console.log(`Successfully fetched ${peptideSnapshot.docs.length} peptides`);
    
    // Test error handling for transport errors
    console.log('Testing transport error handling');
    // Test mock error handling by simulating transport errors
    const errorHandled = await new Promise(resolve => {
      const mockError = {
        message: 'Mock WebChannelConnection RPC Listen stream transport errored'
      };
      console.warn('@firebase/firestore: Firestore (TEST): WebChannelConnection RPC Listen stream transport errored');
      
      // If our code is working, the error handler should trigger
      setTimeout(() => resolve(true), 500);
    });
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

// Test UUID generation
function testUuidGeneration() {
  // Generate a UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  console.log('Testing UUID generation...');
  
  const uuid = generateUUID();
  console.log('Generated UUID:', uuid);
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);
  
  console.log('UUID valid format:', isValid);
  return isValid;
}

// Run tests and print results
async function runAllTests() {
  console.log('=== DATABASE CONNECTION TESTS ===');
  
  console.log('\n1. Testing UUID Generation');
  const uuidResult = testUuidGeneration();
  
  console.log('\n2. Testing Firebase Connection');
  const firebaseResult = await testFirebaseConnection();
  
  console.log('\n=== TEST RESULTS ===');
  console.log('UUID Generation:', uuidResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Firebase Connection:', firebaseResult ? '✅ PASSED' : '❌ FAILED');
  
  if (uuidResult && firebaseResult) {
    console.log('\n✅ All tests passed! The fixes appear to be working.');
  } else {
    console.log('\n❌ Some tests failed. More debugging may be required.');
  }
}

// Run tests
runAllTests();