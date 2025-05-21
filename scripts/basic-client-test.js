/**
 * Basic Firebase Client Test
 * 
 * Simplest possible test of Firebase client connectivity
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  getDocs
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

async function basicTest() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized');
    
    console.log('Getting Firestore instance...');
    const db = getFirestore(app);
    console.log('Firestore instance created');
    
    console.log('Attempting to read from "test" collection...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'test'));
      console.log('Read successful!');
      console.log(`Found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log(`Document data: ${JSON.stringify(doc.data())}`);
      });
      
      console.log('Test passed!');
    } catch (readError) {
      console.error('Error reading from Firestore:', readError);
      console.log('Test failed');
    }
  } catch (error) {
    console.error('Error in test:', error);
    console.log('Test failed');
  }
}

// Run the test
basicTest();