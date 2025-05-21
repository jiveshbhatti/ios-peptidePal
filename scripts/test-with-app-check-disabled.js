/**
 * Test with App Check Debugging
 * 
 * This script attempts to get around App Check by using debug mode
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc,
  setDoc
} = require('firebase/firestore');

console.log('TESTING WITH APP CHECK DEBUGGING');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Before initializing Firebase, try to set the debug token
try {
  console.log('Setting up App Check debug environment variable...');
  // This only works in browser environments, not Node.js, but we'll try
  if (typeof self !== 'undefined' && self.FIREBASE_APPCHECK_DEBUG_TOKEN === undefined) {
    console.log('Setting global debug token (browser environment)');
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  } else if (typeof global !== 'undefined') {
    console.log('Setting global debug token (Node.js environment)');
    global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
} catch (e) {
  console.log('Could not set debug token:', e);
}

async function testWithAppCheckDisabled() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized');
    
    // Special initialization for Firestore
    console.log('Getting Firestore instance with special settings...');
    const db = getFirestore(app);
    console.log('Firestore instance obtained');
    
    // Test reading
    console.log('\nTesting read from test_collection...');
    try {
      const querySnapshot = await getDocs(collection(db, 'test_collection'));
      console.log(`✅ Successfully read from test_collection - found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach(doc => {
        console.log(` - ${doc.id}: ${JSON.stringify(doc.data())}`);
      });
      
      // If read is successful, try to write
      console.log('\nTesting write operation...');
      try {
        const testDocRef = doc(collection(db, 'test_collection'), `client_test_${Date.now()}`);
        await setDoc(testDocRef, {
          message: 'Test from client SDK',
          timestamp: new Date().toISOString(),
        });
        console.log('✅ Successfully wrote to test_collection!');
      } catch (writeError) {
        console.error('❌ Error writing to test_collection:', writeError);
      }
      
    } catch (readError) {
      console.error('❌ Error reading from test_collection:', readError);
      
      if (readError.code === 'permission-denied') {
        console.log('\nPERMISSION DENIED ERROR:');
        console.log('1. Make sure security rules are updated to:');
        console.log('   allow read, write: if true;');
        console.log('2. App Check is blocking access. You must:');
        console.log('   a. Disable App Check completely in Firebase Console, or');
        console.log('   b. Register your app with App Check and implement it properly, or');
        console.log('   c. Enable Debug Mode in the Firebase Console for App Check');
        console.log('   d. For web apps, add this before Firebase initialization:');
        console.log('      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;');
      }
    }
    
    console.log('\nTEST COMPLETED');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testWithAppCheckDisabled();