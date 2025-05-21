/**
 * Test client access to Firebase documents
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  collection,
  doc,
  getDoc,
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

console.log('TESTING CLIENT ACCESS TO FIREBASE');
console.log('This script tests if the client can read the test documents created by the Admin SDK');
console.log('');

async function testClientAccess() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    // Get Firestore instance
    const db = getFirestore(app);
    console.log('✅ Firestore instance obtained');
    
    // 1. Try to read the public test document
    console.log('\nTEST 1: Reading public test document');
    try {
      const publicDocRef = doc(db, 'public_test', 'test_doc');
      const publicDocSnap = await getDoc(publicDocRef);
      
      if (publicDocSnap.exists()) {
        console.log('✅ Successfully read public test document:');
        console.log(publicDocSnap.data());
      } else {
        console.log('❌ Public test document does not exist');
      }
    } catch (error) {
      console.error('❌ Error reading public test document:', error);
    }
    
    // 2. Try to read documents in the test collection
    console.log('\nTEST 2: Reading documents in test collection');
    try {
      const testCollectionRef = collection(db, 'test');
      const querySnapshot = await getDocs(testCollectionRef);
      
      if (querySnapshot.empty) {
        console.log('❌ No documents found in test collection');
      } else {
        console.log(`✅ Successfully read ${querySnapshot.size} documents from test collection`);
        querySnapshot.forEach(doc => {
          console.log(`Document ID: ${doc.id}`);
          console.log('Document data:', doc.data());
        });
      }
    } catch (error) {
      console.error('❌ Error reading test collection:', error);
    }
    
    // 3. Try to read the nested document
    console.log('\nTEST 3: Reading nested document');
    try {
      const nestedDocRef = doc(db, 'public_test', 'test_doc', 'nested', 'nested_doc');
      const nestedDocSnap = await getDoc(nestedDocRef);
      
      if (nestedDocSnap.exists()) {
        console.log('✅ Successfully read nested document:');
        console.log(nestedDocSnap.data());
      } else {
        console.log('❌ Nested document does not exist');
      }
    } catch (error) {
      console.error('❌ Error reading nested document:', error);
    }
    
    console.log('\nACCESS TESTS COMPLETE');
    
  } catch (error) {
    console.error('TEST FAILED with error:', error);
  }
}

// Run the test
testClientAccess();