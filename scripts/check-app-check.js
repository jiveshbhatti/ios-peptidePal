/**
 * Check App Check Status
 * 
 * This script checks if App Check is enabled for the project
 * using the Firebase Admin SDK
 */
const admin = require('firebase-admin');
const path = require('path');

console.log('CHECKING APP CHECK STATUS');

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
      projectId: serviceAccount.project_id
    });
    console.log('Firebase Admin initialized successfully');
  }
  
  // Get App Check administration API
  const appCheck = admin.appCheck();
  console.log('App Check admin API obtained');
  
  // Function to check App Check status
  async function checkAppCheckStatus() {
    try {
      console.log('Checking App Check status...');
      
      // Create a test verification token (this will work if App Check is enabled)
      try {
        console.log('Attempting to create App Check verification token...');
        const token = await appCheck.createToken('1:229078698562:web:a3a431131daad253b7fbdb', {
          ttlMillis: 3600 * 1000, // 1 hour
        });
        
        console.log('✅ Successfully created App Check token!');
        console.log('This indicates App Check is ENABLED for this app');
        console.log('Token details:', token);
      } catch (tokenError) {
        console.error('❌ Error creating App Check token:', tokenError);
        
        if (tokenError.code === 'app-check/invalid-app-id') {
          console.log('App Check appears to be enabled, but this app ID is not registered');
        } else if (tokenError.code === 'app-check/not-enabled') {
          console.log('App Check appears to be DISABLED for this project');
        } else {
          console.log('Error indicates possible App Check configuration issue');
        }
      }
      
      console.log('\nRECOMMENDATIONS:');
      console.log('1. Go to Firebase Console > App Check to check if it\'s enabled');
      console.log('2. If enabled, either disable it or register your development environment');
      console.log('3. For development, you can set App Check to "Debug mode" to allow clients');
      
    } catch (error) {
      console.error('Error checking App Check status:', error);
    }
  }
  
  // Run the check
  checkAppCheckStatus();
  
} catch (error) {
  console.error('Error initializing:', error);
}