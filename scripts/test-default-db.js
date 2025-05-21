/**
 * Test Access to Default Firestore Database
 * 
 * This script tests if the Admin SDK can access the default database
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('TESTING ACCESS TO DEFAULT FIRESTORE DATABASE');

// Service account path
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

// Cleanup any existing apps
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
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('Firebase Admin initialized successfully');
  
  // Get Firestore
  const firestore = admin.firestore();
  console.log('Firestore instance obtained');
  
  // Function to test database access
  async function testDatabaseAccess() {
    try {
      // Create a test document
      console.log('Creating test document in default database...');
      const testDocRef = firestore.collection('test_collection').doc(`test_${Date.now()}`);
      
      await testDocRef.set({
        message: 'Test document in default database',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Successfully wrote to default database!');
      
      // Read the document
      console.log('Reading test document...');
      const docSnap = await testDocRef.get();
      console.log('✅ Successfully read from default database!');
      console.log('Document data:', docSnap.data());
      
      // List collections
      console.log('Listing collections in default database...');
      const collections = await firestore.listCollections();
      console.log(`Found ${collections.length} collections in default database:`);
      collections.forEach(coll => {
        console.log(` - ${coll.id}`);
      });
      
      console.log('\nDEFAULT DATABASE ACCESS TEST SUCCESSFUL');
      console.log('The Admin SDK can read and write to the default database');
      
      console.log('\nNEXT STEPS:');
      console.log('1. Go to Firebase Console > Firestore Database > Rules');
      console.log('2. Update the security rules to allow all access for development:');
      console.log('   rules_version = \'2\';');
      console.log('   service cloud.firestore {');
      console.log('     match /databases/{database}/documents {');
      console.log('       match /{document=**} {');
      console.log('         allow read, write: if true;');
      console.log('       }');
      console.log('     }');
      console.log('   }');
      console.log('3. Go to Firebase Console > App Check and check if it\'s enabled');
      console.log('   - If enabled, disable it temporarily for development');
      
    } catch (error) {
      console.error('❌ Error accessing default database:', error);
      
      if (error.code === 'not-found' || error.code === 5) {
        console.log('\nThe default database might not be fully created yet.');
        console.log('Wait a few minutes and try again, or check the Firebase Console.');
      }
    }
  }
  
  // Run the test
  testDatabaseAccess();
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
}