/**
 * Test Client Access to Default Firestore Database
 * 
 * This script tests if a client can access the default database
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc
} = require('firebase/firestore');

console.log('TESTING CLIENT ACCESS TO DEFAULT FIRESTORE DATABASE');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function testClientAccess() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized');
    
    // Get Firestore
    console.log('Getting Firestore instance...');
    const db = getFirestore(app);
    console.log('Firestore instance obtained');
    
    // Test reading
    console.log('Testing read from test_collection...');
    try {
      const querySnapshot = await getDocs(collection(db, 'test_collection'));
      console.log(`✅ Successfully read from test_collection - found ${querySnapshot.size} documents`);
      
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          console.log(` - ${doc.id}: ${JSON.stringify(doc.data())}`);
        });
      }
    } catch (readError) {
      console.error('❌ Error reading from test_collection:', readError);
      
      if (readError.code === 'permission-denied') {
        console.log('\nPERMISSION DENIED ERROR:');
        console.log('1. Check that security rules are set correctly in Firebase Console');
        console.log('2. Check if App Check is enabled - if so, disable it for development');
      }
    }
    
    console.log('\nCLIENT ACCESS TEST COMPLETED');
    
  } catch (error) {
    console.error('Error in client test:', error);
  }
}

// Run the test
testClientAccess();