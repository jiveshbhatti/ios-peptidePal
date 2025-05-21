/**
 * Check Specific Firestore Database
 * 
 * This script tests access to the 'peptidepal' database specifically
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('CHECKING SPECIFIC FIRESTORE DATABASE: peptidepal');

// Service account path
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

try {
  // Load service account
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  }
  
  // Get Firestore with specific database
  const firestoreOptions = {
    databaseId: 'peptidepal'  // Explicitly specifying the database ID
  };
  const firestore = admin.firestore(firestoreOptions);
  console.log('Firestore initialized with specific database: peptidepal');
  
  // Function to check database access
  async function checkDatabaseAccess() {
    try {
      console.log('Testing access to the peptidepal database...');
      
      // Create a test document
      const timestamp = new Date().toISOString();
      const testDocRef = firestore.collection('test_collection').doc(`db_test_${Date.now()}`);
      await testDocRef.set({
        message: 'Test document for peptidepal database',
        timestamp: timestamp,
        created_by: 'Admin SDK'
      });
      console.log('✅ Successfully wrote to peptidepal database!');
      
      // Read the document back
      const docSnapshot = await testDocRef.get();
      console.log('✅ Successfully read from peptidepal database!');
      console.log('Document data:', docSnapshot.data());
      
      // List collections
      console.log('Listing collections in peptidepal database...');
      const collections = await firestore.listCollections();
      console.log(`Found ${collections.length} collections:`);
      for (const collection of collections) {
        console.log(` - ${collection.id}`);
      }
      
      console.log('\nDATABASE ACCESS SUCCESSFUL');
      console.log('The service account can read and write to the peptidepal database');
      console.log('\nNext Steps:');
      console.log('1. Go to Firebase Console > App Check and disable it temporarily');
      console.log('2. Make sure your app is using this exact database configuration:');
      console.log(`   databaseId: 'peptidepal'`);
      console.log('3. After disabling App Check, try the client test again');
      
    } catch (error) {
      console.error('Error checking database access:', error);
      console.log('\nThe peptidepal database might not be accessible. Make sure:');
      console.log('1. The database ID is correct');
      console.log('2. The service account has permissions for this database');
    }
  }
  
  // Run the check
  checkDatabaseAccess();
  
} catch (error) {
  console.error('Error initializing:', error);
}