/**
 * Detailed Firebase Client Test
 * 
 * This script performs more detailed testing of Firebase client connection
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
  waitForPendingWrites
} = require('firebase/firestore');
const { 
  getAuth, 
  signInAnonymously,
  signOut
} = require('firebase/auth');

// Firebase configuration - verified to be correct
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

console.log('🔍 DETAILED FIREBASE CLIENT TEST');
console.log('This script provides detailed logs for Firebase client connectivity');
console.log('');

async function runTest() {
  try {
    // Phase 1: Initialize Firebase
    console.log('PHASE 1: INITIALIZATION');
    console.log('Initializing Firebase with config:', JSON.stringify(firebaseConfig, null, 2));
    
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully!');
    
    // Phase 2: Initialize Auth and Firestore
    console.log('\nPHASE 2: AUTH & FIRESTORE SETUP');
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    // Initialize Firestore with better settings for debugging
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    // Try disabling and re-enabling the network
    console.log('Disabling network...');
    await disableNetwork(db);
    console.log('Network disabled');
    
    console.log('Re-enabling network...');
    await enableNetwork(db);
    console.log('Network re-enabled');
    
    // Phase 3: Try Anonymous Authentication
    console.log('\nPHASE 3: ANONYMOUS AUTHENTICATION');
    try {
      console.log('Attempting anonymous sign-in...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Signed in anonymously:', userCredential.user.uid);
    } catch (authError) {
      console.error('❌ Anonymous auth failed:', authError);
      console.log('Continuing without authentication...');
    }
    
    // Phase 4: Test Reading
    console.log('\nPHASE 4: TEST READING');
    try {
      console.log('Attempting to read from test collection...');
      const querySnapshot = await getDocs(collection(db, 'test'));
      console.log(`✅ Successfully read from 'test' collection - found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log(`Document data: ${JSON.stringify(doc.data())}`);
      });
    } catch (readError) {
      console.error('❌ Error reading from test collection:', readError);
    }
    
    // Phase 5: Test Writing
    console.log('\nPHASE 5: TEST WRITING');
    try {
      const timestamp = new Date().toISOString();
      const docId = `client-test-${Date.now()}`;
      console.log(`Attempting to write document 'test/${docId}'...`);
      
      const docData = {
        message: "Test from client SDK",
        timestamp: timestamp,
        clientTest: true,
        randomValue: Math.random() * 1000
      };
      
      await setDoc(doc(db, 'test', docId), docData);
      console.log('✅ Document written successfully!');
      
      // Verify it was written
      console.log(`Verifying document 'test/${docId}' was written...`);
      const docSnap = await getDoc(doc(db, 'test', docId));
      
      if (docSnap.exists()) {
        console.log('✅ Document exists! Data:', docSnap.data());
      } else {
        console.log('❌ Document does not exist after writing!');
      }
    } catch (writeError) {
      console.error('❌ Error writing document:', writeError);
      
      // Log more details about the error
      if (writeError.code === 'permission-denied') {
        console.error('\nPERMISSION DENIED ERROR DETAILS:');
        console.error('1. Make sure security rules are set correctly in Firebase Console');
        console.error('2. Current rules should be:');
        console.error('   rules_version = \'2\';');
        console.error('   service cloud.firestore {');
        console.error('     match /databases/{database}/documents {');
        console.error('       match /{document=**} {');
        console.error('         allow read, write: if true;');
        console.error('       }');
        console.error('     }');
        console.error('   }');
        console.error('3. Make sure rules are published');
        console.error('4. There might be a delay before new rules take effect');
        console.error('5. Check Firebase Console for any error messages');
      }
    }
    
    // Phase 6: Cleanup
    console.log('\nPHASE 6: CLEANUP');
    try {
      if (auth.currentUser) {
        console.log('Signing out...');
        await signOut(auth);
        console.log('✅ Signed out');
      }
    } catch (signOutError) {
      console.error('❌ Error signing out:', signOutError);
    }
    
    console.log('\nTEST COMPLETE');
    
  } catch (error) {
    console.error('TEST FAILED with error:', error);
  }
}

// Run the test
runTest();