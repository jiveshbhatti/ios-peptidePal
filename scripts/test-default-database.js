/**
 * Test Default Database Access
 * 
 * This script checks if the service account can access the default database
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('TESTING DEFAULT DATABASE ACCESS');

// Service account path
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

try {
  // Load service account
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize Firebase Admin with explicit database selection
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    console.log('Firebase Admin initialized successfully');
  }
  
  // Get Firestore reference to the default database
  const defaultDb = admin.firestore();
  console.log('Got reference to default database');
  
  // Test function to read and write to database
  async function testDatabase() {
    try {
      // Create a test document
      console.log('Writing test document to default database...');
      const docRef = defaultDb.collection('test_collection').doc('test_doc');
      await docRef.set({
        message: 'Test from Admin SDK',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Successfully wrote to default database');
      
      // Read the document
      console.log('Reading test document from default database...');
      const docSnap = await docRef.get();
      console.log('✅ Successfully read from default database');
      console.log('Document data:', docSnap.data());
      
      // List collections
      console.log('Listing collections in default database...');
      const collections = await defaultDb.listCollections();
      console.log(`Found ${collections.length} collections in default database:`);
      collections.forEach(collection => {
        console.log(` - ${collection.id}`);
      });
      
      console.log('\nDEFAULT DATABASE TEST SUCCESSFUL');
      console.log('The service account can read and write to the default database');
      
      // Now let's get and display the security rules if possible
      try {
        // Unfortunately, there's no direct way to get security rules with the Admin SDK
        // We'll read a document in a way that would trigger security rules
        console.log('\nTesting client-like access to force security rules check...');
        const publicDocRef = defaultDb.collection('public_test').doc('security_test');
        await publicDocRef.set({
          message: 'Testing security rules',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          security_note: 'Admin SDK bypasses security rules'
        });
        console.log('✅ Successfully created test document');
        
        // This will always work because Admin SDK bypasses security rules
        console.log('Note: Admin SDK bypasses security rules, so this test always succeeds');
        console.log('To test client access, use the client SDK tests');
      } catch (securityError) {
        console.error('Error in security test:', securityError);
      }
      
    } catch (error) {
      console.error('Error testing default database:', error);
    }
  }
  
  // Run the test
  testDatabase();
  
} catch (error) {
  console.error('Error initializing:', error);
}