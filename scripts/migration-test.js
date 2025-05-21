/**
 * Migration Test
 * 
 * This script tests the migration of a test peptide
 * from Supabase to Firebase
 */
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc,
  setDoc, 
  serverTimestamp,
  Timestamp
} = require('firebase/firestore');

console.log('TESTING MIGRATION FROM SUPABASE TO FIREBASE');

// Before initializing Firebase, set up App Check debug mode
if (typeof self !== 'undefined') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
} else if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Supabase configuration
const supabaseUrl = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Helper function to convert dates to Firestore timestamps
function dateToTimestamp(date) {
  if (!date) return null;
  try {
    return Timestamp.fromDate(new Date(date));
  } catch (e) {
    console.warn('Error converting date:', e);
    return null;
  }
}

// Test migration of a single peptide
async function testMigration() {
  try {
    // Initialize Supabase
    console.log('Initializing Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase initialized');
    
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized');
    
    // Create a test peptide in Supabase
    console.log('\nCreating test peptide in Supabase...');
    const testPeptide = {
      name: 'Migration Test Peptide',
      strength: '5mg',
      dosageUnit: 'mcg',
      typicalDosageUnits: 200,
      schedule: { frequency: 'daily', times: ['AM'] },
      startDate: new Date().toISOString(),
      vials: [
        {
          id: 'test-vial-1',
          isActive: true,
          initialAmountUnits: 5000,
          remainingAmountUnits: 5000,
          reconstitutionDate: new Date().toISOString()
        }
      ],
      doseLogs: []
    };
    
    const { data: createdPeptide, error: createError } = await supabase
      .from('peptides')
      .insert([testPeptide])
      .select();
      
    if (createError) {
      console.error('Error creating test peptide in Supabase:', createError);
      return false;
    }
    
    const peptideId = createdPeptide[0].id;
    console.log(`✅ Test peptide created in Supabase with ID: ${peptideId}`);
    
    // Transform for Firebase
    console.log('\nTransforming peptide for Firebase...');
    const firebasePeptide = {
      ...createdPeptide[0],
      startDate: dateToTimestamp(createdPeptide[0].startDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove vials and doseLogs for main document
    const vials = firebasePeptide.vials || [];
    delete firebasePeptide.vials;
    delete firebasePeptide.doseLogs;
    
    // Import to Firebase
    console.log('\nImporting to Firebase...');
    
    // Create main peptide document
    console.log('Creating peptide document...');
    await setDoc(doc(db, 'peptides', peptideId), firebasePeptide);
    console.log('✅ Peptide document created in Firebase');
    
    // Create vials subcollection
    if (vials.length > 0) {
      console.log('Creating vials subcollection...');
      
      for (const vial of vials) {
        const vialId = vial.id || `vial_${Math.random().toString(36).substr(2, 9)}`;
        
        const firebaseVial = {
          ...vial,
          reconstitutionDate: dateToTimestamp(vial.reconstitutionDate),
          createdAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'peptides', peptideId, 'vials', vialId), firebaseVial);
        console.log(`✅ Vial document created: ${vialId}`);
      }
    }
    
    console.log('\nMIGRATION TEST SUCCESSFUL!');
    console.log('A test peptide was created in Supabase and successfully migrated to Firebase.');
    console.log('You can view it in the Firebase Console under the "peptides" collection.');
    
    return true;
  } catch (error) {
    console.error('Migration test failed:', error);
    return false;
  }
}

// Run the migration test
testMigration();