/**
 * Create test data with explicit permissions using Admin SDK
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('CREATING TEST DATA WITH EXPLICIT PERMISSIONS');

// Set the path to the service account key file
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';
console.log(`Loading service account from: ${serviceAccountPath}`);

try {
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize the app
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('Firebase Admin app initialized successfully');
  }
  
  // Get Firestore instance
  const firestore = admin.firestore();
  console.log('Firestore instance obtained');
  
  // Create a test document with explicit permissions
  async function createTestData() {
    // Create a test collection with public permissions document
    console.log('Creating test data with explicit permissions...');
    
    // 1. Create a document in the "public_test" collection
    const publicDocRef = firestore.collection('public_test').doc('test_doc');
    await publicDocRef.set({
      message: 'This is a public test document',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      publicAccess: true,
      testId: Date.now(),
      note: 'This document should be accessible by any client'
    });
    console.log('✅ Created public test document');
    
    // 2. Create a nested collection and document
    const nestedDocRef = publicDocRef.collection('nested').doc('nested_doc');
    await nestedDocRef.set({
      message: 'This is a nested document',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      nestedData: true
    });
    console.log('✅ Created nested document');
    
    // Display instructions for client testing
    console.log('\nTEST DATA CREATED SUCCESSFULLY');
    console.log('\nTo test client access, run:');
    console.log('node scripts/test-client-access.js');
    
    return true;
  }
  
  // Run the function
  createTestData()
    .then(() => {
      console.log('Operation completed');
    })
    .catch(error => {
      console.error('Operation failed:', error);
    });
  
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}