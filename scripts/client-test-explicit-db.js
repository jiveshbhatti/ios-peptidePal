/**
 * Client Test with Explicit Database Selection
 * 
 * This script tests accessing the default database with explicit selection
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  connectFirestoreEmulator,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb",
  // Add explicit database selection
  databaseURL: "https://peptidepal.firebaseio.com"
};

console.log('CLIENT TEST WITH EXPLICIT DATABASE SELECTION');
console.log('Connecting to the default database with different settings');

async function runTest() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized');
    
    // Use initializeFirestore with more robust settings
    console.log('Initializing Firestore with robust settings...');
    const db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
    console.log('Firestore initialized');
    
    // Test reading from a collection we know exists
    console.log('Testing read from test_collection...');
    try {
      console.log('Fetching document from test_collection/test_doc...');
      const docRef = doc(db, 'test_collection', 'test_doc');
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        console.log('✅ Document exists!');
        console.log('Document data:', docSnapshot.data());
      } else {
        console.log('❌ Document not found');
      }
    } catch (readError) {
      console.error('❌ Error reading document:', readError);
    }
    
    // Test listing collections
    console.log('\nTesting listing collections...');
    try {
      const collectionRef = collection(db, 'test_collection');
      const querySnapshot = await getDocs(collectionRef);
      
      console.log(`Found ${querySnapshot.size} documents in test_collection`);
      querySnapshot.forEach(doc => {
        console.log(` - ${doc.id}`);
      });
    } catch (listError) {
      console.error('❌ Error listing collections:', listError);
    }
    
    console.log('\nTEST COMPLETED');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
runTest();