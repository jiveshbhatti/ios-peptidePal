/**
 * Create a simple test document in Firebase
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc
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

async function createTestDocument() {
  console.log('Creating test document in Firebase...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Create a very simple document
    const docData = {
      name: "Test Document",
      created: new Date().toISOString(),
      value: 42
    };
    
    console.log('Attempting to write document...');
    
    // Try to write to the 'test' collection
    await setDoc(doc(db, 'test', 'test-doc'), docData);
    
    console.log('Document written successfully!');
    return true;
  } catch (error) {
    console.error('Error creating document:', error);
    return false;
  }
}

// Run the function
createTestDocument().then(success => {
  console.log('Operation ' + (success ? 'succeeded' : 'failed'));
});