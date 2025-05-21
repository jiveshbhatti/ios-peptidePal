/**
 * Create a simple test document in Firebase using the Admin SDK
 */
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Path to service account - try to use path from env vars if available
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '../serviceAccountKey.json');

try {
  console.log('Creating test document with Firebase Admin SDK...');
  
  // Initialize admin SDK
  console.log(`Using service account from: ${SERVICE_ACCOUNT_PATH}`);
  
  // Try to load and parse the service account file
  let serviceAccount;
  try {
    serviceAccount = require(SERVICE_ACCOUNT_PATH);
    console.log('Service account loaded successfully');
  } catch (e) {
    console.error(`Error loading service account from ${SERVICE_ACCOUNT_PATH}:`, e);
    console.error('Please ensure you have a valid serviceAccountKey.json file');
    console.error('or provide the path via FIREBASE_SERVICE_ACCOUNT_PATH environment variable.');
    process.exit(1);
  }

  // Initialize the app
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });

  const db = admin.firestore();
  
  // Create a test document
  async function createDocument() {
    try {
      // Create a simple document
      const docData = {
        name: "Admin Test Document",
        created: admin.firestore.Timestamp.now(),
        value: 42,
        fromAdmin: true
      };
      
      console.log('Attempting to write document using Admin SDK...');
      
      // Write to the test collection
      await db.collection('test').doc('admin-test-doc').set(docData);
      
      console.log('Document written successfully with Admin SDK!');
      
      // Clean up
      await app.delete();
      return true;
    } catch (error) {
      console.error('Error creating document with Admin SDK:', error);
      
      // Clean up even on error
      try {
        await app.delete();
      } catch (e) {
        console.error('Error cleaning up Firebase app:', e);
      }
      
      return false;
    }
  }

  // Run the function
  createDocument().then(success => {
    console.log('Operation ' + (success ? 'succeeded' : 'failed'));
    process.exit(success ? 0 : 1);
  });
  
} catch (error) {
  console.error('Top-level error:', error);
  process.exit(1);
}