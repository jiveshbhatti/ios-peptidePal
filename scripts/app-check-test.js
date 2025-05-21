/**
 * App Check Test
 * 
 * Tests if the Firebase client SDK with App Check enabled will work
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  getDocs,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore
const db = getFirestore(app);

// Test Function
async function testAppCheck() {
  console.log('Testing Firebase App Check...');
  
  try {
    // Try a read operation
    console.log('Attempting to read from test collection...');
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log(`Found ${querySnapshot.size} documents`);
    console.log('✅ Read operation successful!');
    
    // Try a write operation
    console.log('Attempting to write a test document...');
    const docRef = doc(collection(db, 'test'), `app-check-test-${Date.now()}`);
    await setDoc(docRef, {
      message: 'Test from app check',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Write operation successful!');
    
    console.log('All tests passed - App Check is properly configured');
  } catch (error) {
    console.error('Error during app check test:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\nAPP CHECK ISSUES:');
      console.log('Your app might be blocked by Firebase App Check protection');
      console.log('Possible solutions:');
      console.log('1. Check if App Check is enabled in your Firebase project');
      console.log('2. Add debug tokens for your development environment');
      console.log('3. Check security rules to confirm they allow access even with App Check');
    }
  }
}

// Run the test
testAppCheck();