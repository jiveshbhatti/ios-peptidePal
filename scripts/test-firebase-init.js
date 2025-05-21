/**
 * Test Firebase Initialization
 * 
 * This script directly tests the Firebase initialization to check
 * if we're getting the correct Firestore instance.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

console.log('TESTING FIREBASE INITIALIZATION');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Initialize Firebase directly, without using the shared config
const directApp = initializeApp(firebaseConfig, 'test-app-instance');
const directDb = getFirestore(directApp);

async function testFirestoreAccess() {
  console.log('\nTesting Firestore access with direct initialization:');
  
  try {
    // Test collection access
    console.log('Attempting to access "peptides" collection...');
    const peptideRef = collection(directDb, 'peptides');
    console.log('Collection reference created successfully');
    
    // Try to get documents
    console.log('Attempting to query documents...');
    const snapshot = await getDocs(peptideRef);
    console.log(`Successfully retrieved ${snapshot.docs.length} documents from "peptides" collection`);
    
    // Log out some document info if any exist
    if (snapshot.docs.length > 0) {
      console.log('\nFirst document sample:');
      const firstDoc = snapshot.docs[0];
      console.log(`ID: ${firstDoc.id}`);
      console.log(`Data: ${JSON.stringify(firstDoc.data(), null, 2)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error accessing Firestore:', error);
    return false;
  }
}

testFirestoreAccess().then(success => {
  if (success) {
    console.log('\nFirebase initialization test SUCCEEDED');
    console.log('Direct Firestore initialization works correctly');
  } else {
    console.log('\nFirebase initialization test FAILED');
    console.log('There might be issues with Firebase or Firestore configuration');
  }
});