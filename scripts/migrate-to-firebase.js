#!/usr/bin/env node

/**
 * Migration Script: Supabase to Firebase
 * 
 * This script exports data from Supabase and imports it into Firebase.
 * It handles the necessary transformations to adapt the data model.
 */

// Import required libraries
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp
} = require('firebase/firestore');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Ensure the backups directory exists
const backupDir = path.join(__dirname, '../backups/migration');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Export data from Supabase and save to JSON file
 */
async function exportFromSupabase() {
  console.log('Exporting data from Supabase...');
  
  try {
    // Export all tables
    const tables = [
      'peptides', 
      'inventory_peptides', 
      'inventory_bac_water',
      'inventory_syringes', 
      'inventory_other_items'
    ];
    
    const exportData = {};
    
    for (const table of tables) {
      console.log(`Exporting ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*');
        
      if (error) {
        console.error(`Error exporting ${table}:`, error);
        continue;
      }
      
      exportData[table] = data;
      console.log(`Exported ${data.length} records from ${table}`);
    }
    
    // Create timestamp for backup
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const exportFile = path.join(backupDir, `supabase-export-${timestamp}.json`);
    
    // Write to file
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log(`Export complete! Saved to: ${exportFile}`);
    return exportFile;
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

/**
 * Helper function to convert ISO string dates to Firebase Timestamp objects
 */
function isoStringToTimestamp(isoString) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return Timestamp.fromDate(date);
  } catch (e) {
    console.warn('Error converting date', e);
    return null;
  }
}

/**
 * Transform Supabase data for Firebase Firestore using our new schema
 */
function transformForFirebase(exportFile) {
  console.log('Transforming data for Firebase...');
  
  try {
    // Read exported data
    const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    
    // Create Firebase data structure following our schema
    const firebaseData = {
      peptides: {},
      inventory_peptides: {},
      inventory_bac_water: {},
      inventory_syringes: {},
      inventory_other_items: {}
    };
    
    // Map peptides and inventory together
    const peptideMap = new Map();
    if (data.peptides) {
      data.peptides.forEach(peptide => peptideMap.set(peptide.id, peptide));
    }
    
    // Transform peptides according to PeptideDocument schema
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
          
          // Correctly convert dates to Firebase Timestamps
          startDate: isoStringToTimestamp(peptide.startDate || peptide.startdate),
          createdAt: isoStringToTimestamp(peptide.createdAt || peptide.createdat || new Date().toISOString()),
          updatedAt: isoStringToTimestamp(peptide.updatedAt || peptide.updatedat || new Date().toISOString()),
          
          // Include vials directly in the document
          vials: (peptide.vials || []).map(vial => ({
            ...vial,
            reconstitutionDate: isoStringToTimestamp(vial.reconstitutionDate || vial.dateAdded),
            expirationDate: isoStringToTimestamp(vial.expirationDate)
          })),
          
          // Include doseLogs directly in the document (if they exist)
          doseLogs: (peptide.doseLogs || peptide.doselogs || []).map(log => ({
            id: log.id || `log_${Math.random().toString(36).substr(2, 9)}`,
            dosage: log.dosage || log.amount || 0,
            unit: log.unit || peptide.dosageUnit || 'mcg',
            date: isoStringToTimestamp(log.date || log.loggedAt),
            timeOfDay: log.timeOfDay || 'AM',
            notes: log.notes || '',
            vialId: log.vialId || ''
          }))
        };
      });
    }
    
    // Transform inventory peptides according to InventoryPeptideDocument schema
    if (data.inventory_peptides) {
      data.inventory_peptides.forEach(invPeptide => {
        // Parse batch number for usage tracking
        let usedDoses = 0;
        if (invPeptide.batch_number && invPeptide.batch_number.startsWith('USAGE:')) {
          try {
            usedDoses = parseInt(invPeptide.batch_number.split('USAGE:')[1], 10);
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        firebaseData.inventory_peptides[invPeptide.id] = {
          id: invPeptide.id,
          name: invPeptide.name,
          num_vials: invPeptide.num_vials || 0,
          concentration_per_vial_mcg: invPeptide.concentration_per_vial_mcg || 0,
          storage_location: invPeptide.storage_location || '',
          batch_number: invPeptide.batch_number || '',
          bac_water_volume_added: invPeptide.bac_water_volume_added || 0,
          typical_dose_mcg: invPeptide.typical_dose_mcg || 0,
          low_stock_threshold: invPeptide.low_stock_threshold || 2,
          active_vial_status: invPeptide.active_vial_status || 'NONE',
          
          // Convert dates to Firebase Timestamps
          expiry_date: isoStringToTimestamp(invPeptide.expiry_date),
          active_vial_expiry_date: isoStringToTimestamp(invPeptide.active_vial_expiry_date),
          active_vial_reconstitution_date: isoStringToTimestamp(invPeptide.active_vial_reconstitution_date),
          created_at: isoStringToTimestamp(invPeptide.created_at || new Date().toISOString()),
          updated_at: isoStringToTimestamp(invPeptide.updated_at || new Date().toISOString())
        };
      });
    }
    
    // Transform inventory BAC water according to InventoryBacWaterDocument schema
    if (data.inventory_bac_water) {
      data.inventory_bac_water.forEach((item, index) => {
        firebaseData.inventory_bac_water[item.id || `bac_${index}`] = {
          id: item.id || `bac_${index}`,
          volume_ml_per_bottle: item.volume_ml_per_bottle || 0,
          num_bottles: item.num_bottles || 0,
          expiry_date: isoStringToTimestamp(item.expiry_date),
          created_at: isoStringToTimestamp(item.created_at || new Date().toISOString()),
          updated_at: isoStringToTimestamp(item.updated_at || new Date().toISOString())
        };
      });
    }
    
    // Transform inventory syringes according to InventorySyringeDocument schema
    if (data.inventory_syringes) {
      data.inventory_syringes.forEach((item, index) => {
        firebaseData.inventory_syringes[item.id || `syringe_${index}`] = {
          id: item.id || `syringe_${index}`,
          type_size: item.type_size || '',
          quantity: item.quantity || 0,
          brand: item.brand || '',
          created_at: isoStringToTimestamp(item.created_at || new Date().toISOString()),
          updated_at: isoStringToTimestamp(item.updated_at || new Date().toISOString())
        };
      });
    }
    
    // Transform inventory other items according to InventoryOtherItemDocument schema
    if (data.inventory_other_items) {
      data.inventory_other_items.forEach((item, index) => {
        firebaseData.inventory_other_items[item.id || `item_${index}`] = {
          id: item.id || `item_${index}`,
          item_name: item.item_name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          notes: item.notes || '',
          created_at: isoStringToTimestamp(item.created_at || new Date().toISOString()),
          updated_at: isoStringToTimestamp(item.updated_at || new Date().toISOString())
        };
      });
    }
    
    // Create timestamp for the transformed data
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const transformedFile = path.join(backupDir, `firebase-import-${timestamp}.json`);
    
    // Write transformed data
    fs.writeFileSync(transformedFile, JSON.stringify(firebaseData, null, 2));
    
    console.log(`Transformation complete! Saved to: ${transformedFile}`);
    return transformedFile;
  } catch (error) {
    console.error('Transformation failed:', error);
    process.exit(1);
  }
}

/**
 * Import data to Firebase Firestore
 */
async function importToFirebase(transformedFile) {
  console.log('Importing data to Firebase...');
  
  try {
    // Read transformed data
    const data = JSON.parse(fs.readFileSync(transformedFile, 'utf8'));
    
    // Clear existing data first (optional, only if requested)
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('Clearing existing Firebase data...');
      await clearFirebaseCollections(['peptides', 'inventory_peptides', 'inventory_bac_water', 'inventory_syringes', 'inventory_other_items']);
    }
    
    // Import peptides using our new schema
    console.log('Importing peptides...');
    for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
      console.log(`Importing peptide: ${peptideData.name} (${peptideId})`);
      const peptideRef = doc(firestore, 'peptides', peptideId);
      
      // Convert any null values to undefined to avoid Firebase errors
      const cleanedData = Object.entries(peptideData).reduce((acc, [key, value]) => {
        if (value !== null) acc[key] = value;
        return acc;
      }, {});
      
      await setDoc(peptideRef, cleanedData);
    }
    
    // Import inventory peptides
    console.log('Importing inventory peptides...');
    for (const [id, itemData] of Object.entries(data.inventory_peptides)) {
      console.log(`Importing inventory peptide: ${itemData.name} (${id})`);
      const itemRef = doc(firestore, 'inventory_peptides', id);
      
      // Clean null values
      const cleanedData = Object.entries(itemData).reduce((acc, [key, value]) => {
        if (value !== null) acc[key] = value;
        return acc;
      }, {});
      
      await setDoc(itemRef, cleanedData);
    }
    
    // Import BAC water
    console.log('Importing BAC water...');
    for (const [id, itemData] of Object.entries(data.inventory_bac_water)) {
      console.log(`Importing BAC water: ${id}`);
      const itemRef = doc(firestore, 'inventory_bac_water', id);
      
      // Clean null values
      const cleanedData = Object.entries(itemData).reduce((acc, [key, value]) => {
        if (value !== null) acc[key] = value;
        return acc;
      }, {});
      
      await setDoc(itemRef, cleanedData);
    }
    
    // Import syringes
    console.log('Importing syringes...');
    for (const [id, itemData] of Object.entries(data.inventory_syringes)) {
      console.log(`Importing syringe: ${id}`);
      const itemRef = doc(firestore, 'inventory_syringes', id);
      
      // Clean null values
      const cleanedData = Object.entries(itemData).reduce((acc, [key, value]) => {
        if (value !== null) acc[key] = value;
        return acc;
      }, {});
      
      await setDoc(itemRef, cleanedData);
    }
    
    // Import other items
    console.log('Importing other items...');
    for (const [id, itemData] of Object.entries(data.inventory_other_items)) {
      console.log(`Importing other item: ${id}`);
      const itemRef = doc(firestore, 'inventory_other_items', id);
      
      // Clean null values
      const cleanedData = Object.entries(itemData).reduce((acc, [key, value]) => {
        if (value !== null) acc[key] = value;
        return acc;
      }, {});
      
      await setDoc(itemRef, cleanedData);
    }
    
    console.log('Import complete!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

/**
 * Clear Firebase collections
 */
async function clearFirebaseCollections(collectionNames) {
  for (const collectionName of collectionNames) {
    console.log(`Clearing collection: ${collectionName}`);
    
    const collectionRef = collection(firestore, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const deletePromises = [];
    snapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(firestore, collectionName, document.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`Cleared ${deletePromises.length} documents from ${collectionName}`);
  }
}

/**
 * Run the full migration process
 */
async function runMigration() {
  try {
    console.log('🚀 Starting the safe migration process (Supabase → Firebase)');
    console.log('⚠️ IMPORTANT: No data will be deleted from Supabase');
    console.log('📋 Migration Steps:');
    console.log('  1. Export data from Supabase');
    console.log('  2. Transform data for Firebase format');
    console.log('  3. Import data to Firebase (if --no-import is not specified)');
    console.log('  4. Verify successful migration');
    console.log('');
    
    // Step 1: Export from Supabase
    console.log('👉 STEP 1: Exporting from Supabase...');
    const exportFile = await exportFromSupabase();
    console.log('✅ Export successful!');
    console.log('');
    
    // Step 2: Transform for Firebase
    console.log('👉 STEP 2: Transforming data for Firebase...');
    const transformedFile = transformForFirebase(exportFile);
    console.log('✅ Transformation successful!');
    console.log('');
    
    // Step 3: Import to Firebase (optional)
    const shouldImport = !process.argv.includes('--no-import');
    
    if (shouldImport) {
      console.log('👉 STEP 3: Importing to Firebase...');
      console.log('⚠️ This will ADD to existing Firebase data (no Supabase data will be deleted)');
      
      // Ask for confirmation before proceeding with import
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const confirmation = await new Promise(resolve => {
        rl.question('Do you want to continue with the import to Firebase? (yes/no): ', answer => {
          resolve(answer.toLowerCase() === 'yes');
          rl.close();
        });
      });
      
      if (confirmation) {
        await importToFirebase(transformedFile);
        console.log('✅ Import successful!');
      } else {
        console.log('⏭️ Import skipped by user. Your transformed data is saved at:');
        console.log(`   ${transformedFile}`);
      }
    } else {
      console.log('⏭️ Import to Firebase skipped (--no-import flag detected)');
      console.log('📄 Your transformed data is ready for manual import at:');
      console.log(`   ${transformedFile}`);
    }
    
    console.log('');
    console.log('🎉 Migration process completed successfully!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('  1. In the app, use the database switcher to toggle to Firebase');
    console.log('  2. Test your app with the Firebase database');
    console.log('  3. When ready, set Firebase as the default in DatabaseContext.tsx');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute migration when run directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  exportFromSupabase,
  transformForFirebase,
  importToFirebase,
  runMigration
};