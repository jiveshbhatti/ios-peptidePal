/**
 * Improved Firebase Error Test
 * 
 * This script performs more detailed error analysis for Firebase operations
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  connectFirestoreEmulator
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

/**
 * Analyze Firebase error for more helpful diagnostics
 */
function analyzeFirebaseError(error) {
  console.log('Analyzing Firebase error...');
  console.log(`Error code: ${error.code}`);
  console.log(`Error message: ${error.message}`);
  
  // Check for specific error types
  if (error.code === 'not-found') {
    console.log('');
    console.log('🔍 NOT_FOUND ERROR DIAGNOSIS:');
    console.log('This typically occurs when:');
    console.log('1. The Firestore database does not exist in the project');
    console.log('2. The project ID is incorrect');
    console.log('3. The Firestore database has not been initialized');
    console.log('');
    console.log('RECOMMENDED FIX:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select the "peptidepal" project');
    console.log('3. Go to Firestore Database in the left navigation');
    console.log('4. If not already created, click "Create Database"');
    console.log('5. Choose "Start in Native mode" when prompted');
    console.log('6. Select an appropriate region (preferably a US region)');
  } else if (error.code === 'permission-denied') {
    console.log('');
    console.log('🔍 PERMISSION DENIED ERROR DIAGNOSIS:');
    console.log('This typically occurs when:');
    console.log('1. Security rules are too restrictive');
    console.log('2. You are not properly authenticated');
    console.log('');
    console.log('RECOMMENDED FIX:');
    console.log('1. Go to Firebase Console > Firestore > Rules');
    console.log('2. Temporarily set rules to allow read/write:');
    console.log('   rules_version = \'2\';');
    console.log('   service cloud.firestore {');
    console.log('     match /databases/{database}/documents {');
    console.log('       match /{document=**} {');
    console.log('         allow read, write: if true;');
    console.log('       }');
    console.log('     }');
    console.log('   }');
  } else if (error.code === 'unavailable') {
    console.log('');
    console.log('🔍 UNAVAILABLE ERROR DIAGNOSIS:');
    console.log('This typically occurs when:');
    console.log('1. There are network connectivity issues');
    console.log('2. Firebase services are experiencing an outage');
    console.log('3. The app is operating in offline mode');
    console.log('');
    console.log('RECOMMENDED FIX:');
    console.log('1. Check your internet connection');
    console.log('2. Verify no firewall is blocking Firebase domains');
    console.log('3. Check Firebase Status: https://status.firebase.google.com/');
  }
  
  // Special handling for Node.js client
  if (error.message && error.message.includes('10 ABORTED:')) {
    console.log('');
    console.log('🔍 ABORTED ERROR DIAGNOSIS:');
    console.log('This is a common error in Node.js clients and typically occurs when:');
    console.log('1. The Node.js process doesn\'t properly clean up connections');
    console.log('2. The server has a different gRPC version than the client expects');
    console.log('');
    console.log('RECOMMENDED FIX:');
    console.log('1. Add connection cleanup in your code');
    console.log('2. Try using the Firebase Admin SDK instead for Node.js scripts');
  }
}

/**
 * Run tests to diagnose Firebase issues
 */
async function runDiagnosticTests() {
  console.log('🔬 FIREBASE DIAGNOSTICS');
  console.log('This script will perform detailed tests to diagnose Firebase issues');
  console.log('');
  
  try {
    // Initialize Firebase
    console.log('Step 1: Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    // Get Firestore instance
    console.log('');
    console.log('Step 2: Creating Firestore instance...');
    const db = getFirestore(app);
    console.log('✅ Firestore instance created successfully');
    
    // Test basic document read
    console.log('');
    console.log('Step 3: Testing collection reading...');
    try {
      const collectionsToTest = ['peptides', 'test', 'users', 'settings'];
      
      for (const collName of collectionsToTest) {
        console.log(`Testing collection: ${collName}...`);
        const querySnapshot = await getDocs(collection(db, collName));
        console.log(`✅ Successfully read from "${collName}" collection`);
        console.log(`   Found ${querySnapshot.size} documents`);
      }
    } catch (readError) {
      console.log(`❌ Error reading collections: ${readError.message}`);
      analyzeFirebaseError(readError);
    }
    
    // Test document writing
    console.log('');
    console.log('Step 4: Testing document writing...');
    
    // Test document in multiple collections
    const collectionsToWrite = ['test_write', 'settings', 'diagnostic_logs'];
    
    for (const collName of collectionsToWrite) {
      try {
        console.log(`Testing write to "${collName}" collection...`);
        const docRef = doc(collection(db, collName), `test-doc-${Date.now()}`);
        
        // Create a simple test document
        const testData = {
          timestamp: new Date().toISOString(),
          value: Math.random() * 100,
          diagnostic: true,
          message: `Test document written by diagnostic script at ${new Date().toISOString()}`
        };
        
        // Attempt to write the document
        await setDoc(docRef, testData);
        console.log(`✅ Successfully wrote to "${collName}/test-doc"`);
      } catch (writeError) {
        console.log(`❌ Error writing to "${collName}" collection: ${writeError.message}`);
        analyzeFirebaseError(writeError);
      }
    }
    
    console.log('');
    console.log('✅ Diagnostics completed');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during diagnostics:', error);
    analyzeFirebaseError(error);
  }
}

// Run the tests
runDiagnosticTests();