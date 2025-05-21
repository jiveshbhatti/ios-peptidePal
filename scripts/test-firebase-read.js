/**
 * Test Firebase read access
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection,
  getDocs,
  doc,
  getDoc
} = require('firebase/firestore');

// Firebase configuration - same as in the app
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function testFirebaseRead() {
  console.log('Testing Firebase read access...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Initialized Firebase and Firestore...');
    
    // Try to get all collections
    console.log('Getting all collections...');
    
    // First try to read from a specific doc/collection we expect to exist
    try {
      console.log('Attempting to read from test collection...');
      const testDocRef = doc(db, 'test', 'test-doc');
      const testDocSnapshot = await getDoc(testDocRef);
      
      if (testDocSnapshot.exists()) {
        console.log('Found test document:', testDocSnapshot.data());
      } else {
        console.log('Test document does not exist.');
      }
    } catch (testReadError) {
      console.log('Error reading from test collection:', testReadError);
    }
    
    // Try to list all documents in a few collections
    const collectionsList = ['peptides', 'users', 'test', 'doseLogs'];
    
    for (const collectionName of collectionsList) {
      try {
        console.log(`Listing documents in ${collectionName} collection...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        if (querySnapshot.empty) {
          console.log(`No documents found in ${collectionName} collection`);
        } else {
          console.log(`Found ${querySnapshot.size} documents in ${collectionName} collection:`);
          querySnapshot.forEach(doc => {
            console.log(` - ${doc.id}: ${JSON.stringify(doc.data())}`);
          });
        }
      } catch (error) {
        console.error(`Error reading from ${collectionName} collection:`, error);
      }
    }
    
    console.log('Read test completed.');
    return true;
  } catch (error) {
    console.error('Error testing Firebase read:', error);
    return false;
  }
}

// Run the function
testFirebaseRead().then(success => {
  console.log('Operation ' + (success ? 'succeeded' : 'failed'));
  process.exit(success ? 0 : 1);
});