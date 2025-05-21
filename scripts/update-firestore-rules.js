// Import the Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');

console.log("Starting Firestore Rules Update Script...");

// Set the path to the service account key file
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';
console.log(`Loading service account from: ${serviceAccountPath}`);

try {
  var serviceAccount = require(serviceAccountPath);
  console.log("Service account key loaded successfully.");
  
  // Initialize the Firebase Admin app
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log("Firebase Admin app initialized successfully!");
  }
  
  // Get the Firestore database reference
  const firestore = admin.firestore();
  console.log("Firestore database reference obtained.");
  
  // Security rules to update
  const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;

  // Create a REST client using the Admin SDK credentials
  const auth = admin.auth();
  const token = auth.createCustomToken('admin-user')
    .then(token => {
      console.log("Created custom token for Firebase Auth.");
      
      // Use the Firebase Admin SDK to set Firestore rules
      const project = admin.instanceId().app.options.projectId;
      console.log(`Project ID: ${project}`);
      
      // Unfortunately, Firebase Admin SDK doesn't directly expose a method to update security rules
      // We need to use the Firebase CLI or REST API for this
      console.log("\nIMPORTANT: To update Firestore security rules, you need to:");
      console.log("1. Go to Firebase Console: https://console.firebase.google.com/project/peptidepal/firestore/rules");
      console.log("2. Replace the rules with:");
      console.log("==================================================");
      console.log(securityRules);
      console.log("==================================================");
      console.log("3. Click 'Publish' to apply the new rules");
      
      // Let's create a test document to verify we have Admin access
      return firestore.collection('test').doc('admin-rule-test').set({
        message: "Test document to verify Admin SDK access",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        note: "If you can see this document but client-side code can't write, it means security rules need updating."
      });
    })
    .then(() => {
      console.log("\nSuccessfully created a test document with Admin SDK.");
      console.log("The Admin SDK can bypass security rules.");
      console.log("\nAfter updating security rules, try running the client test again:");
      console.log("node scripts/create-test-document.js");
      
      // Exit cleanly
      process.exit(0);
    })
    .catch(error => {
      console.error("Error:", error);
      process.exit(1);
    });
    
} catch (error) {
  console.error("Error loading service account or initializing Firebase:", error);
  process.exit(1);
}