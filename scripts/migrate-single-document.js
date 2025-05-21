/**
 * Simple migration script to insert a single test document
 */
const { initializeApp } = require('firebase/app');
const { 
  initializeFirestore,
  doc, 
  setDoc,
  Timestamp,
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function migrateTestDocument() {
  try {
    console.log('Starting simple migration test...');
    
    // Initialize Firebase with better connection settings
    const app = initializeApp(firebaseConfig);
    
    // Use more robust settings
    const db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
      useFetchStreams: false
    });
    
    console.log('Firebase initialized, trying to reset connection...');
    
    // Connection reset procedure
    try {
      await disableNetwork(db);
      console.log('Network disabled.');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await enableNetwork(db);
      console.log('Network re-enabled.');
    } catch (connError) {
      console.error('Error during connection reset:', connError);
    }
    
    // Simple test document (PeptideDocument format)
    const testPeptide = {
      id: "test-migration-doc",
      name: "Test Migration Peptide",
      strength: "5000mcg",
      dosageUnit: "mcg",
      typicalDosageUnits: 1000,
      schedule: {
        frequency: "daily",
        times: ["AM"]
      },
      notes: "Test document for migration",
      dataAiHint: "",
      imageUrl: "",
      startDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      vials: [
        {
          id: "test-vial-1",
          isActive: true,
          reconstitutionDate: Timestamp.fromDate(new Date()),
          expirationDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          initialAmountUnits: 10,
          remainingAmountUnits: 10,
          reconstitutionBacWaterMl: 2
        }
      ]
    };
    
    console.log('Attempting to write test document to Firebase...');
    
    // Write document to Firestore
    const docRef = doc(db, 'peptides', testPeptide.id);
    await setDoc(docRef, testPeptide);
    
    console.log('Test document written successfully!');
    console.log('Migration test completed successfully.');
    return true;
  } catch (error) {
    console.error('Migration test failed:', error);
    return false;
  }
}

// Run the migration
migrateTestDocument().then(success => {
  console.log('Test Result:', success ? 'SUCCESS' : 'FAILED');
});