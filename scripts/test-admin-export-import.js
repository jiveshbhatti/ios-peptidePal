/**
 * Test script for Admin SDK Export/Import
 * 
 * This script tests a small sample export from Supabase
 * and import to Firebase using the Admin SDK
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// Load environment variables if available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not found, skipping .env loading');
}

// Path to the service account key file
const serviceAccountPath = '/Users/jiveshbhatti/Downloads/peptidepal-firebase-adminsdk-fbsvc-9003dbd28d.json';

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

console.log('🧪 TEST ADMIN EXPORT/IMPORT SCRIPT');
console.log('This script tests exporting a small sample from Supabase and importing to Firebase');
console.log('');

// Initialize Supabase client
console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});
console.log('Supabase client initialized');

// Initialize Firebase Admin SDK
console.log(`Loading service account from: ${serviceAccountPath}`);
try {
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  
  // Initialize the app
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('Firebase Admin app initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Get Firestore instance
const firestore = admin.firestore();

/**
 * Helper function to convert dates to Firestore timestamps
 */
function dateToTimestamp(date) {
  if (!date) return null;
  try {
    const dateObj = new Date(date);
    return admin.firestore.Timestamp.fromDate(dateObj);
  } catch (e) {
    console.warn('Error converting date:', e);
    return null;
  }
}

/**
 * Sample export from Supabase
 */
async function sampleExportFromSupabase() {
  console.log('\n--- STEP 1: Sample Export from Supabase ---');
  
  try {
    // Export from peptides table (limit to 2 records for testing)
    console.log('Exporting sample from peptides table...');
    const { data: peptides, error: peptideError } = await supabase
      .from('peptides')
      .select('*')
      .limit(2);
      
    if (peptideError) {
      console.error('Error exporting peptides:', peptideError);
      return null;
    }
    
    if (!peptides || peptides.length === 0) {
      console.log('No peptides found in Supabase. Creating test data...');
      
      // Create a sample peptide in Supabase for testing
      const { data: newPeptide, error: createError } = await supabase
        .from('peptides')
        .insert([
          {
            name: 'Test Peptide',
            strength: '10mg',
            dosageUnit: 'mcg',
            typicalDosageUnits: 300,
            schedule: { frequency: 'daily', times: ['AM'] },
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            vials: [{
              id: 'test-vial-1',
              isActive: true,
              initialAmountUnits: 5000,
              remainingAmountUnits: 5000,
              reconstitutionDate: new Date().toISOString()
            }],
            doseLogs: []
          }
        ])
        .select();
        
      if (createError) {
        console.error('Error creating test peptide:', createError);
        return null;
      }
      
      console.log('Created test peptide in Supabase');
      return { peptides: newPeptide || [] };
    }
    
    console.log(`Exported ${peptides.length} peptides from Supabase`);
    return { peptides };
  } catch (error) {
    console.error('Sample export failed:', error);
    return null;
  }
}

/**
 * Transform data for Firebase
 */
function transformForFirebase(data) {
  console.log('\n--- STEP 2: Transform for Firebase ---');
  
  try {
    const firebaseData = {
      peptides: {}
    };
    
    if (data.peptides) {
      data.peptides.forEach(peptide => {
        // Create peptide document
        firebaseData.peptides[peptide.id] = {
          id: peptide.id,
          name: peptide.name || 'Unnamed Peptide',
          strength: peptide.strength || '',
          dosageUnit: peptide.dosageUnit || peptide.dosageunit || 'mcg',
          typicalDosageUnits: peptide.typicalDosageUnits || peptide.typicaldosageunits || 0,
          schedule: peptide.schedule || { frequency: 'daily', times: ['AM'] },
          notes: peptide.notes || '',
          dataAiHint: peptide.dataAiHint || peptide.dataaihint || '',
          imageUrl: peptide.imageUrl || peptide.imageurl || '',
          
          // Dates will be converted to timestamps during import
          startDate: peptide.startDate || peptide.startdate || new Date().toISOString(),
          createdAt: peptide.createdAt || peptide.createdat || new Date().toISOString(),
          updatedAt: peptide.updatedAt || peptide.updatedat || new Date().toISOString(),
          
          // Include vials directly in the document
          vials: (peptide.vials || []).map(vial => ({
            ...vial,
            reconstitutionDate: vial.reconstitutionDate || vial.dateAdded || new Date().toISOString(),
            expirationDate: vial.expirationDate || null
          })),
          
          // Include doseLogs directly in the document
          doseLogs: (peptide.doseLogs || peptide.doselogs || []).map(log => ({
            id: log.id || `log_${Math.random().toString(36).substr(2, 9)}`,
            dosage: log.dosage || log.amount || 0,
            unit: log.unit || peptide.dosageUnit || 'mcg',
            date: log.date || log.loggedAt || new Date().toISOString(),
            timeOfDay: log.timeOfDay || 'AM',
            notes: log.notes || '',
            vialId: log.vialId || ''
          }))
        };
      });
    }
    
    console.log('Transformation complete');
    console.log(`Transformed ${Object.keys(firebaseData.peptides).length} peptide documents`);
    
    return firebaseData;
  } catch (error) {
    console.error('Transformation failed:', error);
    return null;
  }
}

/**
 * Import to Firebase
 */
async function importToFirebase(data) {
  console.log('\n--- STEP 3: Import to Firebase ---');
  
  try {
    // Import peptides
    console.log('Importing peptides...');
    
    for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
      console.log(`Processing peptide: ${peptideData.name} (${peptideId})`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...peptideData,
        startDate: dateToTimestamp(peptideData.startDate),
        createdAt: dateToTimestamp(peptideData.createdAt),
        updatedAt: dateToTimestamp(peptideData.updatedAt)
      };
      
      // Delete vials and doseLogs arrays from the main document
      // We'll store them in subcollections
      const vials = processedData.vials || [];
      const doseLogs = processedData.doseLogs || [];
      delete processedData.vials;
      delete processedData.doseLogs;
      
      // Create the peptide document
      console.log(`Writing peptide document: ${peptideId}`);
      await firestore.collection('peptides').doc(peptideId).set(processedData);
      
      // Create vials subcollection
      if (vials.length > 0) {
        console.log(`Writing ${vials.length} vials to subcollection`);
        
        for (const vial of vials) {
          const vialId = vial.id || `vial_${Math.random().toString(36).substr(2, 9)}`;
          
          // Convert dates to timestamps
          const processedVial = {
            ...vial,
            reconstitutionDate: dateToTimestamp(vial.reconstitutionDate),
            expirationDate: dateToTimestamp(vial.expirationDate),
            dateAdded: dateToTimestamp(vial.dateAdded)
          };
          
          await firestore
            .collection('peptides')
            .doc(peptideId)
            .collection('vials')
            .doc(vialId)
            .set(processedVial);
        }
      }
      
      // Create doseLogs subcollection
      if (doseLogs.length > 0) {
        console.log(`Writing ${doseLogs.length} dose logs to subcollection`);
        
        for (const log of doseLogs) {
          const logId = log.id || `log_${Math.random().toString(36).substr(2, 9)}`;
          
          // Convert dates to timestamps
          const processedLog = {
            ...log,
            date: dateToTimestamp(log.date)
          };
          
          await firestore
            .collection('peptides')
            .doc(peptideId)
            .collection('doseLogs')
            .doc(logId)
            .set(processedLog);
        }
      }
    }
    
    console.log('Import complete!');
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}

/**
 * Run export/import test
 */
async function runTest() {
  try {
    // Step 1: Sample export
    const exportedData = await sampleExportFromSupabase();
    if (!exportedData) {
      console.error('Export failed, unable to continue');
      return;
    }
    
    // Step 2: Transform data
    const transformedData = transformForFirebase(exportedData);
    if (!transformedData) {
      console.error('Transformation failed, unable to continue');
      return;
    }
    
    // Step 3: Import to Firebase
    const importSuccess = await importToFirebase(transformedData);
    if (!importSuccess) {
      console.error('Import failed');
      return;
    }
    
    console.log('\n✅ TEST COMPLETE: Successfully exported from Supabase and imported to Firebase');
    console.log('Check the Firebase Console to see the imported data: https://console.firebase.google.com/project/peptidepal/firestore/data/~2Fpeptides');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();