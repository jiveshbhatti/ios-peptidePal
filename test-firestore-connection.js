// Import the Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path'); // Node.js built-in module for path manipulation

console.log("Starting Firebase Firestore connection test script...");

// Set the path to the service account key file
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';
console.log(`Attempting to load service account key from: ${serviceAccountPath}`);

try {
  var serviceAccount = require(serviceAccountPath);
  console.log("Service account key loaded successfully.");
  console.log(`Project ID from service account: ${serviceAccount.project_id}`);
} catch (error) {
  console.error("ERROR: Could not load service account key.");
  console.error(`Please make sure the path is correct and the file exists: ${error.message}`);
  process.exit(1); // Exit the script if the key can't be loaded
}


// Initialize the Firebase Admin app
// Check if an app is already initialized to avoid errors if you run this multiple times
if (admin.apps.length === 0) {
  console.log("Initializing Firebase Admin app...");
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // You don't strictly need databaseURL or storageBucket for just Firestore,
      // but including projectId is good practice.
      projectId: serviceAccount.project_id // Use project ID from service account
    });
    console.log("Firebase Admin app initialized successfully!");
  } catch (error) {
    console.error("ERROR: Failed to initialize Firebase Admin app.");
    console.error(error);
    process.exit(1); // Exit if initialization fails
  }
} else {
  console.log("Firebase Admin app already initialized.");
}


// Get a reference to the Firestore database
console.log("Getting Firestore database reference...");
const db = admin.firestore();
console.log("Firestore database reference obtained.");

// --- Test Read Operation ---
console.log("\n----- TEST 1: READ OPERATION -----");
// Try to read from a test collection
const testDocRef = db.collection('test').doc('test-doc');
console.log(`Attempting to read document: test/test-doc`);

testDocRef.get()
  .then(docSnapshot => {
    if (docSnapshot.exists) {
      console.log("SUCCESS: Document 'test/test-doc' found!");
      console.log("Document data:", docSnapshot.data());
    } else {
      // This is a successful connection, but the document was not found
      console.log("SUCCESS: Reached Firestore, but document 'test/test-doc' does NOT exist.");
      console.log("This is normal if you haven't created this document yet.");
    }
    console.log("Read test PASSED (backend reachable)!");
    
    // Proceed to write test
    runWriteTest();
  })
  .catch(error => {
    console.error("ERROR: Failed to read document or connect to Firestore.");
    console.error(error);

    // Check if the error code is related to connection issues
    if (error.code) {
        console.error(`Firebase Error Code: ${error.code}`);
        if (error.code === 'unavailable' || error.code === 14) {
             console.error("This error suggests a potential network or backend connectivity issue.");
        } else if (error.code === 'not-found' || error.code === 5) {
             console.error("This error means the document path was not found. The Firestore database might not exist yet.");
             console.error("Please go to Firebase Console and create a Firestore database in Native mode.");
        } else if (error.code === 'permission-denied' || error.code === 7) {
             console.error("This error means the service account doesn't have permission.");
        }
    }

    console.log("Firestore read test FAILED.");
    // Still try the write test
    runWriteTest();
  });

// --- Test Write Operation ---
function runWriteTest() {
  console.log("\n----- TEST 2: WRITE OPERATION -----");
  // Try to write to a test collection
  const writeDocRef = db.collection('test').doc(`test-doc-${Date.now()}`);
  const testData = {
    message: "Test document created by Admin SDK",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    testId: Date.now()
  };
  
  console.log(`Attempting to write document to: ${writeDocRef.path}`);
  console.log(`Document data:`, testData);
  
  writeDocRef.set(testData)
    .then(() => {
      console.log(`SUCCESS: Document written to ${writeDocRef.path}`);
      console.log("Write test PASSED!");
      
      // If we get here, run list collections test
      runListCollectionsTest();
    })
    .catch(error => {
      console.error("ERROR: Failed to write document.");
      console.error(error);
      
      // Check if the error code is related to connection issues
      if (error.code) {
          console.error(`Firebase Error Code: ${error.code}`);
          if (error.code === 'unavailable' || error.code === 14) {
               console.error("This error suggests a potential network or backend connectivity issue.");
          } else if (error.code === 'not-found' || error.code === 5) {
               console.error("This error means the document path was not found. The Firestore database might not exist yet.");
               console.error("Please go to Firebase Console and create a Firestore database in Native mode.");
          } else if (error.code === 'permission-denied' || error.code === 7) {
               console.error("This error means the service account doesn't have permission.");
          }
      }
      
      console.log("Firestore write test FAILED.");
      
      // Still try the list collections test
      runListCollectionsTest();
    });
}

// --- Test List Collections ---
function runListCollectionsTest() {
  console.log("\n----- TEST 3: LIST COLLECTIONS -----");
  console.log("Attempting to list all collections in the database...");
  
  db.listCollections()
    .then(collections => {
      console.log(`Found ${collections.length} collections:`);
      collections.forEach(collection => {
        console.log(` - ${collection.id}`);
      });
      console.log("List collections test PASSED!");
      console.log("\nAll tests completed.");
    })
    .catch(error => {
      console.error("ERROR: Failed to list collections.");
      console.error(error);
      console.log("List collections test FAILED.");
      console.log("\nTests completed with errors.");
    });
}