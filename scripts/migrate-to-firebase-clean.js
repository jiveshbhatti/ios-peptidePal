/**
 * Migration Script: Supabase to Firebase
 * 
 * This script exports data from Supabase and imports it to Firebase
 * using the client SDK with App Check debug token.
 */
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc,
  setDoc,
  Timestamp,
  writeBatch
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

console.log('MIGRATION: SUPABASE TO FIREBASE');

// Enable App Check debug token
if (typeof global !== 'undefined') {
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

// Ensure backup directory exists
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

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

// Process command line arguments
const args = process.argv.slice(2);
const shouldSkipImport = args.includes('--no-import');
const shouldClearData = args.includes('--clear');

/**
 * Export data from Supabase
 */
async function exportFromSupabase() {
  console.log('Exporting data from Supabase...');
  
  try {
    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    return { exportFile, exportData };
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

/**
 * Transform Supabase data for Firebase
 */
function transformForFirebase(exportData) {
  console.log('\nTransforming data for Firebase...');
  
  try {
    // Create Firebase data structure following the schema
    const firebaseData = {
      peptides: {},
      inventory_peptides: {},
      inventory_bac_water: {},
      inventory_syringes: {},
      inventory_other_items: {}
    };
    
    // Transform peptides according to Firebase schema
    if (exportData.peptides) {
      exportData.peptides.forEach(peptide => {
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
          
          // Vials and doseLogs will be stored in subcollections
          vials: peptide.vials || [],
          doseLogs: peptide.doseLogs || peptide.doselogs || []
        };
      });
    }
    
    // Transform inventory_peptides
    if (exportData.inventory_peptides) {
      exportData.inventory_peptides.forEach(item => {
        firebaseData.inventory_peptides[item.id] = {
          id: item.id,
          name: item.name || '',
          num_vials: item.num_vials || 0,
          concentration_per_vial_mcg: item.concentration_per_vial_mcg || 0,
          storage_location: item.storage_location || '',
          batch_number: item.batch_number || '',
          bac_water_volume_added: item.bac_water_volume_added || 0,
          typical_dose_mcg: item.typical_dose_mcg || 0,
          low_stock_threshold: item.low_stock_threshold || 2,
          active_vial_status: item.active_vial_status || 'NONE',
          
          // Dates
          expiry_date: item.expiry_date || null,
          active_vial_expiry_date: item.active_vial_expiry_date || null,
          active_vial_reconstitution_date: item.active_vial_reconstitution_date || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Transform inventory_bac_water
    if (exportData.inventory_bac_water) {
      exportData.inventory_bac_water.forEach(item => {
        firebaseData.inventory_bac_water[item.id || `bac_${Date.now()}`] = {
          id: item.id || `bac_${Date.now()}`,
          volume_ml_per_bottle: item.volume_ml_per_bottle || 0,
          num_bottles: item.num_bottles || 0,
          expiry_date: item.expiry_date || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Transform inventory_syringes
    if (exportData.inventory_syringes) {
      exportData.inventory_syringes.forEach(item => {
        firebaseData.inventory_syringes[item.id || `syringe_${Date.now()}`] = {
          id: item.id || `syringe_${Date.now()}`,
          type_size: item.type_size || '',
          quantity: item.quantity || 0,
          brand: item.brand || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Transform inventory_other_items
    if (exportData.inventory_other_items) {
      exportData.inventory_other_items.forEach(item => {
        firebaseData.inventory_other_items[item.id || `item_${Date.now()}`] = {
          id: item.id || `item_${Date.now()}`,
          item_name: item.item_name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          notes: item.notes || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Create timestamp for the transformed data
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const transformedFile = path.join(backupDir, `firebase-import-${timestamp}.json`);
    
    // Write transformed data
    fs.writeFileSync(transformedFile, JSON.stringify(firebaseData, null, 2));
    
    console.log(`Transformation complete! Saved to: ${transformedFile}`);
    return { transformedFile, firebaseData };
  } catch (error) {
    console.error('Transformation failed:', error);
    process.exit(1);
  }
}

/**
 * Import data to Firebase Firestore
 */
async function importToFirebase(firebaseData) {
  if (shouldSkipImport) {
    console.log('\nSkipping import to Firebase (--no-import flag detected)');
    return;
  }
  
  console.log('\nImporting data to Firebase...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Clear existing data if requested
    if (shouldClearData) {
      console.log('Clearing existing data is not supported in client SDK mode.');
      console.log('Use Firebase Console to manually delete data if needed.');
    }
    
    // Import peptides
    console.log('Importing peptides...');
    
    // Count for progress tracking
    let importedCount = 0;
    const totalPeptides = Object.keys(firebaseData.peptides).length;
    const totalInventoryPeptides = Object.keys(firebaseData.inventory_peptides).length;
    const totalBacWater = Object.keys(firebaseData.inventory_bac_water).length;
    const totalSyringes = Object.keys(firebaseData.inventory_syringes).length;
    const totalOtherItems = Object.keys(firebaseData.inventory_other_items).length;
    
    // Create batches (max 500 operations per batch)
    const BATCH_SIZE = 450; // Keep some margin below the 500 limit
    let batch = writeBatch(db);
    let operationCount = 0;
    
    for (const [peptideId, peptideData] of Object.entries(firebaseData.peptides)) {
      // Extract vials and doseLogs
      const vials = peptideData.vials || [];
      const doseLogs = peptideData.doseLogs || [];
      
      // Remove from main document (they'll go to subcollections)
      const mainDocData = { ...peptideData };
      delete mainDocData.vials;
      delete mainDocData.doseLogs;
      
      // Convert dates to timestamps
      mainDocData.startDate = dateToTimestamp(mainDocData.startDate);
      mainDocData.createdAt = dateToTimestamp(mainDocData.createdAt);
      mainDocData.updatedAt = dateToTimestamp(mainDocData.updatedAt);
      
      // Add peptide document to batch
      const peptideRef = doc(db, 'peptides', peptideId);
      batch.set(peptideRef, mainDocData);
      operationCount++;
      
      // Process vials
      for (const vial of vials) {
        const vialId = vial.id || `vial_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert dates to timestamps
        const processedVial = {
          ...vial,
          reconstitutionDate: dateToTimestamp(vial.reconstitutionDate || vial.dateAdded),
          expirationDate: dateToTimestamp(vial.expirationDate)
        };
        
        // Add vial to batch
        const vialRef = doc(db, 'peptides', peptideId, 'vials', vialId);
        batch.set(vialRef, processedVial);
        operationCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      // Process doseLogs
      for (const log of doseLogs) {
        const logId = log.id || `log_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert dates to timestamps
        const processedLog = {
          ...log,
          date: dateToTimestamp(log.date)
        };
        
        // Add doseLog to batch
        const logRef = doc(db, 'peptides', peptideId, 'doseLogs', logId);
        batch.set(logRef, processedLog);
        operationCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      // Update progress
      importedCount++;
      console.log(`Processed ${importedCount}/${totalPeptides} peptides`);
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Batch committed (${operationCount} operations)`);
      batch = writeBatch(db);
      operationCount = 0;
    }
    
    // Import inventory_peptides
    if (totalInventoryPeptides > 0) {
      console.log('\nImporting inventory peptides...');
      let inventoryPeptidesCount = 0;
      
      for (const [id, itemData] of Object.entries(firebaseData.inventory_peptides)) {
        // Convert dates to timestamps
        const processedData = {
          ...itemData,
          expiry_date: dateToTimestamp(itemData.expiry_date),
          active_vial_expiry_date: dateToTimestamp(itemData.active_vial_expiry_date),
          active_vial_reconstitution_date: dateToTimestamp(itemData.active_vial_reconstitution_date),
          created_at: dateToTimestamp(itemData.created_at),
          updated_at: dateToTimestamp(itemData.updated_at)
        };
        
        const docRef = doc(db, 'inventory_peptides', id);
        batch.set(docRef, processedData);
        operationCount++;
        inventoryPeptidesCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      console.log(`Processed ${inventoryPeptidesCount}/${totalInventoryPeptides} inventory peptides`);
    }
    
    // Import inventory_bac_water
    if (totalBacWater > 0) {
      console.log('\nImporting BAC water...');
      let bacWaterCount = 0;
      
      for (const [id, itemData] of Object.entries(firebaseData.inventory_bac_water)) {
        // Convert dates to timestamps
        const processedData = {
          ...itemData,
          expiry_date: dateToTimestamp(itemData.expiry_date),
          created_at: dateToTimestamp(itemData.created_at),
          updated_at: dateToTimestamp(itemData.updated_at)
        };
        
        const docRef = doc(db, 'inventory_bac_water', id);
        batch.set(docRef, processedData);
        operationCount++;
        bacWaterCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      console.log(`Processed ${bacWaterCount}/${totalBacWater} BAC water items`);
    }
    
    // Import inventory_syringes
    if (totalSyringes > 0) {
      console.log('\nImporting syringes...');
      let syringeCount = 0;
      
      for (const [id, itemData] of Object.entries(firebaseData.inventory_syringes)) {
        // Convert dates to timestamps
        const processedData = {
          ...itemData,
          created_at: dateToTimestamp(itemData.created_at),
          updated_at: dateToTimestamp(itemData.updated_at)
        };
        
        const docRef = doc(db, 'inventory_syringes', id);
        batch.set(docRef, processedData);
        operationCount++;
        syringeCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      console.log(`Processed ${syringeCount}/${totalSyringes} syringes`);
    }
    
    // Import inventory_other_items
    if (totalOtherItems > 0) {
      console.log('\nImporting other inventory items...');
      let otherItemCount = 0;
      
      for (const [id, itemData] of Object.entries(firebaseData.inventory_other_items)) {
        // Convert dates to timestamps
        const processedData = {
          ...itemData,
          created_at: dateToTimestamp(itemData.created_at),
          updated_at: dateToTimestamp(itemData.updated_at)
        };
        
        const docRef = doc(db, 'inventory_other_items', id);
        batch.set(docRef, processedData);
        operationCount++;
        otherItemCount++;
        
        // Commit batch if getting too large
        if (operationCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed (${operationCount} operations)`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      console.log(`Processed ${otherItemCount}/${totalOtherItems} other inventory items`);
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Final batch committed (${operationCount} operations)`);
    }
    
    console.log(`\nImport complete!`);
    console.log(`- Imported ${importedCount} peptides`);
    console.log(`- Imported ${totalInventoryPeptides} inventory peptides`);
    console.log(`- Imported ${totalBacWater} BAC water items`);
    console.log(`- Imported ${totalSyringes} syringes`);
    console.log(`- Imported ${totalOtherItems} other inventory items`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

/**
 * Run the migration
 */
async function runMigration() {
  try {
    console.log('🚀 Starting the migration process (Supabase → Firebase)');
    console.log('');
    
    // Step 1: Export from Supabase
    const { exportData } = await exportFromSupabase();
    
    // Step 2: Transform data
    const { firebaseData } = transformForFirebase(exportData);
    
    // Step 3: Import to Firebase
    await importToFirebase(firebaseData);
    
    console.log('');
    console.log('🎉 Migration process completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();