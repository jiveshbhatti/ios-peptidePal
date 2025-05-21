/**
 * Fix Database Configuration
 * 
 * This script properly tests the specific database configuration
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('FIXING DATABASE CONFIGURATION TEST');

// Service account path
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

// Ensure only one app is initialized
try {
  admin.app();
} catch (e) {
  // No app exists yet
}

// Clean up any existing app
if (admin.apps.length > 0) {
  console.log('Cleaning up existing Firebase apps...');
  admin.apps.forEach(app => {
    try {
      app.delete();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
}

try {
  // Load service account
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize Firebase Admin
  console.log('Initializing Firebase Admin...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('Firebase Admin initialized successfully');
  
  // Get Firestore
  console.log('Getting Firestore instance...');
  const firestore = admin.firestore();
  console.log('Firestore instance obtained');
  
  // Function to test database access
  async function testDatabaseAccess() {
    try {
      // Create a test document
      console.log('Creating test document...');
      const testDocRef = firestore.collection('test_access').doc(`test_${Date.now()}`);
      await testDocRef.set({
        message: 'Database access test',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Successfully wrote test document!');
      
      // Read it back
      console.log('Reading test document...');
      const docSnap = await testDocRef.get();
      console.log('✅ Successfully read test document:', docSnap.data());
      
      // List collections
      console.log('\nListing collections in database...');
      const collections = await firestore.listCollections();
      console.log(`Found ${collections.length} collections:`);
      collections.forEach(coll => {
        console.log(` - ${coll.id}`);
      });
      
      console.log('\nDATABASE ACCESS TEST SUCCESSFUL');
      console.log('Your Firebase Admin SDK can read/write to the Firestore database.');
      
      console.log('\nNEXT STEPS:');
      console.log('1. Go to Firebase Console > App Check and DISABLE App Check');
      console.log('2. This is likely preventing client-side access despite correct security rules');
      console.log('3. After disabling App Check, try client access again');
      
    } catch (error) {
      console.error('❌ Error accessing database:', error);
      
      if (error.code === 'not-found' || error.code === 5) {
        console.log('\nThe database might not exist or might be using a different name.');
        console.log('Go to Firebase Console > Firestore to verify the database name.');
      }
    }
  }
  
  // Run the test
  testDatabaseAccess();
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
}