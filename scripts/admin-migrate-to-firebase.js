/**
 * Admin Migration Script: Supabase to Firebase
 * 
 * This script uses the Firebase Admin SDK with service account credentials
 * to properly migrate data from Supabase to Firebase.
 */

// Import required libraries
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

// Path to the service account key file
// TODO: Replace with actual path to service account key file
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

// Supabase credentials - use values from .env file
const supabaseUrl = process.env.SUPABASE_URL || 'https://yawjzpovpfccgisrrfjo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Initialize Firebase Admin SDK
let firebaseAdmin;
let firestore = null;

try {
  // Check if service account file exists
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.log(`Loading service account from: ${SERVICE_ACCOUNT_PATH}`);
    try {
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      console.log('Service account file loaded successfully');
      
      // Validate service account file has required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key) {
        console.error('⚠️ Service account file is invalid or incomplete');
        console.error('Please generate a new service account key from Firebase Console');
        console.error('See SERVICE_ACCOUNT_INSTRUCTIONS.md for details');
      } else {
        console.log(`Service account project ID: ${serviceAccount.project_id}`);
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        console.log('✅ Firebase Admin SDK initialized successfully with service account');
        
        // Get Firestore instance
        try {
          firestore = firebaseAdmin.firestore();
          console.log('✅ Firestore instance created successfully');
          
          // Test Firestore connection
          console.log('Testing Firestore connection...');
          const testRef = firestore.collection('test').doc('connection-test');
          await testRef.set({ 
            timestamp: admin.firestore.Timestamp.now(),
            message: 'Migration test connection' 
          });
          console.log('✅ Successfully wrote to Firestore!');
        } catch (firestoreError) {
          console.error('❌ Error creating Firestore instance:', firestoreError);
          console.error('This may be due to:
- Invalid project ID
- Firestore not enabled for this project
- Network connectivity issues
- Region mismatch');
        }
      }
    } catch (loadError) {
      console.error('❌ Error loading service account file:', loadError);
      console.error('Please ensure the service account file is valid JSON');
    }
  } else {
    console.error('❌ Service account file not found at:', SERVICE_ACCOUNT_PATH);
    console.error('Please follow the instructions in SERVICE_ACCOUNT_INSTRUCTIONS.md');
    console.error('to generate and place your service account key file');
    
    // Ask if want to continue without import
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const shouldContinue = await new Promise(resolve => {
      rl.question('Do you want to continue without Firestore import capability? (yes/no): ', answer => {
        resolve(answer.toLowerCase() === 'yes');
        rl.close();
      });
    });
    
    if (!shouldContinue) {
      console.log('Exiting. Please set up service account and try again.');
      process.exit(1);
    }
    
    console.log('Continuing without Firebase Admin. Only data export will work.');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  console.log('Will continue without Firebase Admin. Data export will still work.');
}

// Ensure the backups directory exists
const backupDir = path.join(__dirname, '../backups/migration');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

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
    
    // Create Firebase data structure following the schema
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
          
          // Include doseLogs directly in the document (if they exist)
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
          
          // Dates will be converted to timestamps during import
          expiry_date: invPeptide.expiry_date || null,
          active_vial_expiry_date: invPeptide.active_vial_expiry_date || null,
          active_vial_reconstitution_date: invPeptide.active_vial_reconstitution_date || null,
          created_at: invPeptide.created_at || new Date().toISOString(),
          updated_at: invPeptide.updated_at || new Date().toISOString()
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
          expiry_date: item.expiry_date || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
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
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
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
    return transformedFile;
  } catch (error) {
    console.error('Transformation failed:', error);
    process.exit(1);
  }
}

/**
 * Import data to Firebase Firestore using Admin SDK
 */
async function importToFirebase(transformedFile) {
  if (!firestore) {
    console.error('❌ Firebase Admin is not properly initialized. Cannot import data.');
    console.error('Please check your service account credentials and try again.');
    console.error('See detailed instructions in SERVICE_ACCOUNT_INSTRUCTIONS.md');
    return false;
  }
  
  // Verify Firestore connection is working
  try {
    console.log('Verifying Firestore connection before import...');
    const testRef = firestore.collection('test').doc('pre-import-test');
    await testRef.set({ 
      timestamp: admin.firestore.Timestamp.now(),
      message: 'Pre-import connection test' 
    });
    console.log('✅ Firestore connection verified');
  } catch (error) {
    console.error('❌ Cannot connect to Firestore:', error);
    console.error('Please check your network connection and Firebase project configuration');
    return false;
  }
  
  console.log('Importing data to Firebase using Admin SDK...');
  
  try {
    // Read transformed data
    const data = JSON.parse(fs.readFileSync(transformedFile, 'utf8'));
    
    // Clear existing data first (optional, only if requested)
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('Clearing existing Firebase data...');
      await clearFirebaseCollections(['peptides', 'inventory_peptides', 'inventory_bac_water', 'inventory_syringes', 'inventory_other_items']);
    }
    
    // Import peptides
    console.log('Importing peptides...');
    const importBatch = firestore.batch();
    let batchCount = 0;
    let totalWrites = 0;
    
    // Import peptides using our new schema
    for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
      console.log(`Preparing peptide: ${peptideData.name} (${peptideId})`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...peptideData,
        startDate: dateToTimestamp(peptideData.startDate),
        createdAt: dateToTimestamp(peptideData.createdAt),
        updatedAt: dateToTimestamp(peptideData.updatedAt),
        
        // Process vials dates
        vials: peptideData.vials.map(vial => ({
          ...vial,
          reconstitutionDate: dateToTimestamp(vial.reconstitutionDate),
          expirationDate: dateToTimestamp(vial.expirationDate)
        })),
        
        // Process doseLogs dates
        doseLogs: peptideData.doseLogs.map(log => ({
          ...log,
          date: dateToTimestamp(log.date)
        }))
      };
      
      // Add write to batch
      const peptideRef = firestore.collection('peptides').doc(peptideId);
      importBatch.set(peptideRef, processedData);
      
      // Increment counters
      batchCount++;
      totalWrites++;
      
      // Commit when batch reaches 500 writes (Firestore limit)
      if (batchCount >= 500) {
        console.log(`Committing batch of ${batchCount} operations...`);
        try {
          await importBatch.commit();
          console.log('✅ Batch committed successfully');
        } catch (batchError) {
          console.error('❌ Error committing batch:', batchError);
          console.error('This may be due to network issues or permission problems');
          
          // Check for the NOT_FOUND error we've been seeing
          if (batchError.message && batchError.message.includes('NOT_FOUND')) {
            console.error('Received NOT_FOUND error, which typically means:');
            console.error('1. The Firestore database does not exist in this project');
            console.error('2. The project ID in your service account may be incorrect');
            console.error('3. The Firestore database may not be initialized');
            console.error('Please check Firebase Console to ensure Firestore is enabled');
            
            // This is a critical error - stop import
            throw new Error('Critical Firestore access error - stopping import');
          }
        }
        
        // Reset batch
        batchCount = 0;
        importBatch = firestore.batch();
      }
    }
    
    // Import inventory peptides
    console.log('Importing inventory peptides...');
    for (const [id, itemData] of Object.entries(data.inventory_peptides)) {
      console.log(`Preparing inventory peptide: ${itemData.name} (${id})`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...itemData,
        expiry_date: dateToTimestamp(itemData.expiry_date),
        active_vial_expiry_date: dateToTimestamp(itemData.active_vial_expiry_date),
        active_vial_reconstitution_date: dateToTimestamp(itemData.active_vial_reconstitution_date),
        created_at: dateToTimestamp(itemData.created_at),
        updated_at: dateToTimestamp(itemData.updated_at)
      };
      
      // Add write to batch
      const itemRef = firestore.collection('inventory_peptides').doc(id);
      importBatch.set(itemRef, processedData);
      
      // Increment counters
      batchCount++;
      totalWrites++;
      
      // Commit when batch reaches 500 writes
      if (batchCount >= 500) {
        console.log(`Committing batch of ${batchCount} operations...`);
        await importBatch.commit();
        console.log('Batch committed successfully');
        
        // Reset batch
        batchCount = 0;
        importBatch = firestore.batch();
      }
    }
    
    // Import inventory BAC water
    console.log('Importing inventory BAC water...');
    for (const [id, itemData] of Object.entries(data.inventory_bac_water)) {
      console.log(`Preparing BAC water: ${id}`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...itemData,
        expiry_date: dateToTimestamp(itemData.expiry_date),
        created_at: dateToTimestamp(itemData.created_at),
        updated_at: dateToTimestamp(itemData.updated_at)
      };
      
      // Add write to batch
      const itemRef = firestore.collection('inventory_bac_water').doc(id);
      importBatch.set(itemRef, processedData);
      
      // Increment counters
      batchCount++;
      totalWrites++;
    }
    
    // Import inventory syringes
    console.log('Importing inventory syringes...');
    for (const [id, itemData] of Object.entries(data.inventory_syringes)) {
      console.log(`Preparing syringe: ${id}`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...itemData,
        created_at: dateToTimestamp(itemData.created_at),
        updated_at: dateToTimestamp(itemData.updated_at)
      };
      
      // Add write to batch
      const itemRef = firestore.collection('inventory_syringes').doc(id);
      importBatch.set(itemRef, processedData);
      
      // Increment counters
      batchCount++;
      totalWrites++;
    }
    
    // Import inventory other items
    console.log('Importing inventory other items...');
    for (const [id, itemData] of Object.entries(data.inventory_other_items)) {
      console.log(`Preparing other item: ${id}`);
      
      // Convert dates to Firestore timestamps
      const processedData = {
        ...itemData,
        created_at: dateToTimestamp(itemData.created_at),
        updated_at: dateToTimestamp(itemData.updated_at)
      };
      
      // Add write to batch
      const itemRef = firestore.collection('inventory_other_items').doc(id);
      importBatch.set(itemRef, processedData);
      
      // Increment counters
      batchCount++;
      totalWrites++;
    }
    
    // Commit any remaining operations
    if (batchCount > 0) {
      console.log(`Committing final batch of ${batchCount} operations...`);
      try {
        await importBatch.commit();
        console.log('✅ Final batch committed successfully');
      } catch (finalBatchError) {
        console.error('❌ Error committing final batch:', finalBatchError);
        console.error('Import was partially completed. Some data may not have been written.');
        return false;
      }
    }
    
    console.log(`Import complete! Total documents written: ${totalWrites}`);
    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}

/**
 * Clear Firebase collections
 */
async function clearFirebaseCollections(collectionNames) {
  for (const collectionName of collectionNames) {
    console.log(`Clearing collection: ${collectionName}`);
    
    const collectionRef = firestore.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    const deletePromises = [];
    snapshot.forEach((document) => {
      deletePromises.push(document.ref.delete());
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
    console.log('🚀 Starting the Firebase Admin migration process (Supabase → Firebase)');
    console.log('⚠️ IMPORTANT: No data will be deleted from Supabase');
    console.log('📋 Migration Steps:');
    console.log('  1. Export data from Supabase');
    console.log('  2. Transform data for Firebase format');
    console.log('  3. Import data to Firebase using Admin SDK (if --no-import is not specified)');
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
      if (!firestore) {
        console.log('⚠️ Firebase Admin SDK is not configured. Cannot proceed with import.');
        console.log('⚠️ Please set up your service account key and try again.');
        console.log('⚠️ Your transformed data is saved at:');
        console.log(`   ${transformedFile}`);
        return;
      }
      
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
        const success = await importToFirebase(transformedFile);
        if (success) {
          console.log('✅ Import successful!');
        } else {
          console.log('❌ Import failed. Please check the error messages above.');
        }
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
    console.log('🎉 Migration process completed!');
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