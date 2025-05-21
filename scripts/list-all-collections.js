/**
 * List All Firestore Collections
 * 
 * This script lists all collections available in the Firestore database.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, listCollections, collection, getDocs } = require('firebase/firestore');

// Firebase configuration from your app
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function listAllCollections() {
  console.log('===== LISTING ALL COLLECTIONS IN FIRESTORE =====');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig, 'list-collections-app');
    const db = getFirestore(app);
    
    console.log('Connected to Firebase project:', firebaseConfig.projectId);
    console.log('\nAvailable Collections:');
    
    // Unfortunately, listCollections() doesn't work in the client SDK
    // So we'll query these known collections
    const collectionsToCheck = [
      'peptides',
      'inventory_peptides',
      'inventory_bac_water',
      'inventory_syringes',
      'inventory_other_items',
      'test',
      'users',
      'settings',
      'public_test'
    ];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        console.log(`- ${collectionName}: ${querySnapshot.size} documents`);
        
        // Show first document fields for insight
        if (querySnapshot.size > 0) {
          const firstDoc = querySnapshot.docs[0];
          console.log(`  First document ID: ${firstDoc.id}`);
          console.log(`  Fields: ${Object.keys(firstDoc.data()).join(', ')}`);
        }
      } catch (error) {
        console.log(`- ${collectionName}: Error - ${error.message}`);
      }
    }
    
    console.log('\n===== COLLECTION LISTING COMPLETE =====');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
listAllCollections();