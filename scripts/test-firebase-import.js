/**
 * Test script for Firebase import
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore,
  doc, 
  setDoc,
  Timestamp
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Sample test data (one peptide)
const testPeptide = {
  id: "test-peptide-1",
  name: "Test Peptide",
  strength: "5000mcg total",
  dosageUnit: "mcg",
  typicalDosageUnits: 1000,
  schedule: {
    times: ["AM"],
    frequency: "daily"
  },
  notes: "Test peptide for Firebase import",
  dataAiHint: "",
  imageUrl: "",
  startDate: Timestamp.fromDate(new Date()),
  createdAt: Timestamp.fromDate(new Date()),
  updatedAt: Timestamp.fromDate(new Date()),
  vials: [{
    id: "test-vial-1",
    name: "Test Vial",
    notes: "",
    isActive: true,
    reconstitutionDate: Timestamp.fromDate(new Date()),
    expirationDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    initialAmountUnits: 10,
    remainingAmountUnits: 8,
    reconstitutionBacWaterMl: 2
  }],
  doseLogs: [{
    id: "test-log-1",
    dosage: 1000,
    unit: "mcg",
    date: Timestamp.fromDate(new Date()),
    timeOfDay: "AM",
    notes: "",
    vialId: "test-vial-1"
  }]
};

// Test function to import data to Firebase
async function testImport() {
  try {
    console.log('Testing Firebase import with test peptide...');
    
    // Import test peptide
    const peptideRef = doc(firestore, 'peptides', testPeptide.id);
    await setDoc(peptideRef, testPeptide);
    
    console.log('Test import successful!');
    return true;
  } catch (error) {
    console.error('Test import failed:', error);
    return false;
  }
}

// Run the test
testImport().then(success => {
  if (success) {
    console.log('Firebase connection and import functionality confirmed!');
    console.log('You can now run the full migration script.');
  } else {
    console.log('Please check your Firebase configuration and permissions.');
  }
});