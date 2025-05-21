/**
 * Test Imported Firebase Configuration
 * 
 * This script tests using the Firebase config and db instance
 * imported from the firebase-config.js file.
 */

// Directly import the app and db from our firebase-config.js
const { app, db } = require('../src/firebase-config');
const { collection, getDocs } = require('firebase/firestore');

console.log('TESTING IMPORTED FIREBASE CONFIGURATION');

// Check if we have valid app and db objects
console.log('\nChecking imported Firebase instances:');
console.log(`Firebase app object: ${app ? 'VALID ✅' : 'INVALID ❌'}`);
console.log(`Firestore db object: ${db ? 'VALID ✅' : 'INVALID ❌'}`);

async function testImportedFirestore() {
  console.log('\nTesting Firestore access with imported db:');
  
  try {
    // Test collection access
    console.log('Attempting to access "peptides" collection...');
    const peptideRef = collection(db, 'peptides');
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
    console.error('Error accessing Firestore with imported db:', error);
    return false;
  }
}

testImportedFirestore().then(success => {
  if (success) {
    console.log('\nImported Firebase test SUCCEEDED');
    console.log('Using the imported db object works correctly');
  } else {
    console.log('\nImported Firebase test FAILED');
    console.log('There might be issues with the imported Firebase configuration');
  }
});