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
  deleteDoc 
} = require('firebase/firestore');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.firebasestorage.app",
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
 * Transform Supabase data for Firebase Firestore
 */
function transformForFirebase(exportFile) {
  console.log('Transforming data for Firebase...');
  
  try {
    // Read exported data
    const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    
    // Create Firebase data structure
    const firebaseData = {
      peptides: {},
      inventory: {
        bacWater: {},
        syringes: {},
        otherItems: {}
      }
    };
    
    // Map peptides and inventory together
    const peptideMap = new Map();
    if (data.peptides) {
      data.peptides.forEach(peptide => peptideMap.set(peptide.id, peptide));
    }
    
    if (data.inventory_peptides) {
      data.inventory_peptides.forEach(invPeptide => {
        const peptide = peptideMap.get(invPeptide.id) || {};
        
        // Parse batch number for usage tracking
        let usedDoses = 0;
        if (invPeptide.batch_number && invPeptide.batch_number.startsWith('USAGE:')) {
          try {
            usedDoses = parseInt(invPeptide.batch_number.split('USAGE:')[1], 10);
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // Create merged peptide document
        firebaseData.peptides[invPeptide.id] = {
          name: invPeptide.name,
          strength: peptide.strength || '',
          dosageUnit: peptide.dosageUnit || 'mcg',
          typicalDosageUnits: peptide.typicalDosageUnits || 0,
          schedule: peptide.schedule || { frequency: 'daily', times: ['AM'] },
          notes: peptide.notes || '',
          startDate: peptide.startDate || new Date().toISOString(),
          imageUrl: peptide.imageUrl || '',
          dataAiHint: peptide.dataAiHint || '',
          
          // Inventory data
          inventory: {
            numVials: invPeptide.num_vials || 0,
            concentrationPerVialMcg: invPeptide.concentration_per_vial_mcg || 0,
            storageLocation: invPeptide.storage_location || '',
            expiryDate: invPeptide.expiry_date || null,
            lowStockThreshold: invPeptide.low_stock_threshold || 2,
            typicalDoseMcg: invPeptide.typical_dose_mcg || 0
          },
          
          // Active vial data
          activeVial: {
            status: invPeptide.active_vial_status || 'NONE',
            reconstitutionDate: invPeptide.active_vial_reconstitution_date || null,
            expiryDate: invPeptide.active_vial_expiry_date || null,
            bacWaterVolumeAdded: invPeptide.bac_water_volume_added || 0,
            usedDoses: usedDoses
          },
          
          createdAt: invPeptide.created_at || new Date().toISOString(),
          updatedAt: invPeptide.updated_at || new Date().toISOString()
        };
        
        // Extract vials subcollection
        if (peptide.vials && Array.isArray(peptide.vials)) {
          firebaseData.peptides[invPeptide.id].vials = {};
          peptide.vials.forEach((vial, index) => {
            const vialId = vial.id || `vial_${index}`;
            firebaseData.peptides[invPeptide.id].vials[vialId] = {
              ...vial,
              peptideId: invPeptide.id
            };
          });
        }
        
        // Extract dose logs subcollection
        if (peptide.doseLogs && Array.isArray(peptide.doseLogs)) {
          firebaseData.peptides[invPeptide.id].doseLogs = {};
          peptide.doseLogs.forEach((log, index) => {
            const logId = log.id || `log_${index}`;
            firebaseData.peptides[invPeptide.id].doseLogs[logId] = {
              ...log,
              peptideId: invPeptide.id,
              createdAt: log.date // Use the log date as createdAt
            };
          });
        }
      });
    }
    
    // Transform inventory BAC water
    if (data.inventory_bac_water) {
      data.inventory_bac_water.forEach((item, index) => {
        const itemId = item.id || `bac_${index}`;
        firebaseData.inventory.bacWater[itemId] = {
          volumeMlPerBottle: item.volume_ml_per_bottle || 0,
          numBottles: item.num_bottles || 0,
          expiryDate: item.expiry_date || null,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Transform inventory syringes
    if (data.inventory_syringes) {
      data.inventory_syringes.forEach((item, index) => {
        const itemId = item.id || `syringe_${index}`;
        firebaseData.inventory.syringes[itemId] = {
          typeSize: item.type_size || '',
          quantity: item.quantity || 0,
          brand: item.brand || '',
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
        };
      });
    }
    
    // Transform inventory other items
    if (data.inventory_other_items) {
      data.inventory_other_items.forEach((item, index) => {
        const itemId = item.id || `item_${index}`;
        firebaseData.inventory.otherItems[itemId] = {
          itemName: item.item_name || '',
          description: item.description || '',
          quantity: item.quantity || 0,
          notes: item.notes || '',
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
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
      await clearFirebaseCollections(['peptides']);
    }
    
    // Import peptides
    console.log('Importing peptides...');
    for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
      // Extract subcollections
      const vials = peptideData.vials || {};
      const doseLogs = peptideData.doseLogs || {};
      
      // Remove subcollections from main document
      delete peptideData.vials;
      delete peptideData.doseLogs;
      
      // Add main peptide document
      console.log(`Importing peptide: ${peptideData.name} (${peptideId})`);
      const peptideRef = doc(firestore, 'peptides', peptideId);
      await setDoc(peptideRef, peptideData);
      
      // Import vials subcollection
      for (const [vialId, vialData] of Object.entries(vials)) {
        console.log(`- Importing vial: ${vialId}`);
        const vialRef = doc(peptideRef, 'vials', vialId);
        await setDoc(vialRef, vialData);
      }
      
      // Import doseLogs subcollection
      for (const [logId, logData] of Object.entries(doseLogs)) {
        console.log(`- Importing dose log: ${logId}`);
        const logRef = doc(peptideRef, 'doseLogs', logId);
        await setDoc(logRef, logData);
      }
    }
    
    // Import inventory collections
    console.log('Importing inventory items...');
    
    // Import BAC water
    for (const [id, itemData] of Object.entries(data.inventory.bacWater || {})) {
      console.log(`Importing BAC water: ${id}`);
      await addDoc(collection(firestore, 'inventory/bacWater/items'), itemData);
    }
    
    // Import syringes
    for (const [id, itemData] of Object.entries(data.inventory.syringes || {})) {
      console.log(`Importing syringe: ${id}`);
      await addDoc(collection(firestore, 'inventory/syringes/items'), itemData);
    }
    
    // Import other items
    for (const [id, itemData] of Object.entries(data.inventory.otherItems || {})) {
      console.log(`Importing other item: ${id}`);
      await addDoc(collection(firestore, 'inventory/otherItems/items'), itemData);
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
    const exportFile = await exportFromSupabase();
    const transformedFile = transformForFirebase(exportFile);
    
    // Check if we should import to Firebase
    const shouldImport = !process.argv.includes('--no-import');
    if (shouldImport) {
      await importToFirebase(transformedFile);
    } else {
      console.log('Skipping import to Firebase. Data is ready for manual import.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
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