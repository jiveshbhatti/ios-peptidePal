/**
 * Check Firestore Security Rules
 * 
 * This script creates test documents to verify Firestore security rules
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('CHECKING FIRESTORE SECURITY RULES');

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
  
  // Get Firestore
  const firestore = admin.firestore();
  console.log('Firestore initialized');
  
  // Function to check security rules
  async function checkSecurityRules() {
    try {
      console.log('Creating test documents to check security rules...');
      
      // Create a test document
      const testDocRef = firestore.collection('security_test').doc('test_doc');
      await testDocRef.set({
        message: 'Test document for security rules',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_by: 'Admin SDK'
      });
      console.log('✅ Created test document in security_test collection');
      
      // Write to a collection that should be protected
      const protectedDocRef = firestore.collection('protected_test').doc('admin_doc');
      await protectedDocRef.set({
        message: 'This document should only be writable by admin',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_by: 'Admin SDK',
        admin_only: true
      });
      console.log('✅ Created test document in protected_test collection');
      
      console.log('\nTEST DOCUMENTS CREATED SUCCESSFULLY');
      console.log('These can be used to test client access with different security rules');
      
      // Display current security rules if possible
      console.log('\nSECURITY RULES INFORMATION:');
      console.log('To check or update security rules:');
      console.log('1. Go to Firebase Console > Firestore > Rules');
      console.log('2. Ensure rules are set to allow public access during development:');
      console.log('   rules_version = \'2\';');
      console.log('   service cloud.firestore {');
      console.log('     match /databases/{database}/documents {');
      console.log('       match /{document=**} {');
      console.log('         allow read, write: if true;');
      console.log('       }');
      console.log('     }');
      console.log('   }');
      
      console.log('\nREMEMBER: App Check is enabled for this project, which may prevent client access');
      console.log('Go to Firebase Console > App Check and either:');
      console.log('1. Disable App Check temporarily for development, or');
      console.log('2. Enable Debug Mode for development environments');
      
    } catch (error) {
      console.error('Error checking security rules:', error);
    }
  }
  
  // Run the check
  checkSecurityRules();
  
} catch (error) {
  console.error('Error initializing:', error);
}