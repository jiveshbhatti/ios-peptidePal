/**
 * Create a test document in Firebase using Firebase Authentication
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc 
} = require('firebase/firestore');
const { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut
} = require('firebase/auth');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Firebase configuration - same as in the app
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Test user credentials (should be in environment variables for production)
const TEST_EMAIL = process.env.FIREBASE_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.FIREBASE_TEST_PASSWORD || 'testpassword123';

async function createDocumentWithAuth() {
  console.log('Creating test document in Firebase using authentication...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Sign in with test user
    console.log(`Attempting to sign in with test user: ${TEST_EMAIL}`);
    
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('Successfully signed in with test user');
    } catch (signInError) {
      console.error('Error signing in with test user:', signInError);
      console.error('Please ensure you have created a test user in Firebase Authentication');
      console.error('Or provide correct credentials via environment variables:');
      console.error('FIREBASE_TEST_EMAIL and FIREBASE_TEST_PASSWORD');
      return false;
    }
    
    // Create a test document
    const docData = {
      name: "Auth Test Document",
      created: new Date().toISOString(),
      value: 42,
      userId: userCredential.user.uid,
      fromAuthTest: true
    };
    
    console.log('Attempting to write document as authenticated user...');
    
    // Write to the 'test' collection
    await setDoc(doc(db, 'test', 'auth-test-doc'), docData);
    
    console.log('Document written successfully!');
    
    // Sign out the test user
    await signOut(auth);
    console.log('Signed out test user');
    
    return true;
  } catch (error) {
    console.error('Error creating document with auth:', error);
    
    // Try to sign out in case of error
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('Signed out test user after error');
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
    
    return false;
  }
}

// Run the function
createDocumentWithAuth().then(success => {
  console.log('Operation ' + (success ? 'succeeded' : 'failed'));
  process.exit(success ? 0 : 1);
});