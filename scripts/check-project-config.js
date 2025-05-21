/**
 * Check Firebase Project Configuration
 * 
 * This script verifies various Firebase project settings
 * to help diagnose configuration issues
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const https = require('https');

console.log('📋 FIREBASE PROJECT CONFIGURATION CHECK');
console.log('This script checks your Firebase project configuration for common issues');
console.log('');

// Set the path to the service account key file
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';
console.log(`Loading service account from: ${serviceAccountPath}`);

try {
  // Read the service account file
  const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountContent);
  
  console.log('✅ Service account key loaded successfully');
  console.log('');
  
  // Display service account info
  console.log('SERVICE ACCOUNT DETAILS:');
  console.log(`Project ID: ${serviceAccount.project_id}`);
  console.log(`Client Email: ${serviceAccount.client_email}`);
  console.log(`Auth URI: ${serviceAccount.auth_uri}`);
  console.log(`Token URI: ${serviceAccount.token_uri}`);
  console.log('Private Key: ' + (serviceAccount.private_key ? '✅ Present' : '❌ Missing'));
  console.log('');
  
  // Initialize the app
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('✅ Firebase Admin app initialized successfully');
  }
  
  // Check each service
  async function checkServices() {
    console.log('\nCHECKING FIREBASE SERVICES:');
    
    // 1. Check Firestore
    console.log('\n1. FIRESTORE');
    try {
      const firestore = admin.firestore();
      console.log('✅ Firestore instance created successfully');
      
      // Test a simple read
      const testDoc = await firestore.collection('test').doc('service-check').get();
      console.log('✅ Firestore read operation successful');
      
      // Test a simple write
      await firestore.collection('test').doc('service-check').set({
        testTime: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Service check completed successfully'
      });
      console.log('✅ Firestore write operation successful');
    } catch (firestoreError) {
      console.error('❌ Firestore error:', firestoreError);
    }
    
    // 2. Check Authentication
    console.log('\n2. AUTHENTICATION');
    try {
      const auth = admin.auth();
      console.log('✅ Authentication instance created successfully');
      
      // List authentication providers
      try {
        // Unfortunately, Admin SDK doesn't provide a direct way to list providers
        // We'll use a workaround to check if the project exists
        const customToken = await auth.createCustomToken('service-check-user');
        console.log('✅ Custom token creation successful');
        console.log('✅ Authentication service is working');
      } catch (authOperationError) {
        console.error('❌ Authentication operation error:', authOperationError);
      }
    } catch (authError) {
      console.error('❌ Authentication error:', authError);
    }
    
    // 3. Check storage
    console.log('\n3. STORAGE');
    try {
      const storage = admin.storage();
      console.log('✅ Storage instance created successfully');
      
      // Get bucket information
      const bucket = storage.bucket();
      console.log(`✅ Default bucket name: ${bucket.name}`);
    } catch (storageError) {
      console.error('❌ Storage error:', storageError);
    }
    
    // 4. Check project access and permissions
    console.log('\n4. PROJECT SETTINGS & PERMISSIONS');
    try {
      // Create a simple project check to see if we have proper access
      const projectId = admin.app().options.projectId;
      console.log(`Project ID: ${projectId}`);
      
      // Try to access project metadata if possible
      console.log('Checking project setting access...');
      
      // Unfortunately, Admin SDK doesn't provide a direct API for this
      // We can do some basic checks on permissions:
      const permissionTest = await firestore.collection('_permission_test').doc('test').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        test: 'Service account permission test'
      });
      console.log('✅ Service account has write permissions');
      
      // Display client configuration for reference
      console.log('\nCLIENT CONFIGURATION:');
      console.log(`apiKey: "${serviceAccount.client_apiKey || 'AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0'}"`);
      console.log(`authDomain: "${projectId}.firebaseapp.com"`);
      console.log(`projectId: "${projectId}"`);
      console.log(`storageBucket: "${projectId}.appspot.com"`);
      console.log(`messagingSenderId: "229078698562"`);
      console.log(`appId: "1:229078698562:web:a3a431131daad253b7fbdb"`);
      
      // Check if Firestore database exists by listing collections
      const collections = await firestore.listCollections();
      console.log(`✅ Found ${collections.length} collections in Firestore`);
      console.log('Collection names:');
      for (const collection of collections) {
        console.log(` - ${collection.id}`);
      }
    } catch (projectError) {
      console.error('❌ Project check error:', projectError);
    }
    
    // 5. Check security rules (unfortunately, we can't directly read rules with Admin SDK)
    console.log('\n5. SECURITY RULES');
    console.log('To check current security rules:');
    console.log(' 1. Go to Firebase Console: https://console.firebase.google.com/project/peptidepal/firestore/rules');
    console.log(' 2. Verify that rules allow public read/write:');
    console.log('   rules_version = \'2\';');
    console.log('   service cloud.firestore {');
    console.log('     match /databases/{database}/documents {');
    console.log('       match /{document=**} {');
    console.log('         allow read, write: if true;');
    console.log('       }');
    console.log('     }');
    console.log('   }');
    
    console.log('\nCONFIGURATION CHECK COMPLETE');
  }
  
  // Run checks
  checkServices();
  
} catch (error) {
  console.error('❌ Error loading service account or initializing Firebase:', error);
}