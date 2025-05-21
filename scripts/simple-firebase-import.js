/**
 * Simple direct Firebase import script
 * This script bypasses the service account requirement by
 * importing directly using the public API with the open security rules
 */
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  Timestamp,
  connectFirestoreEmulator
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

// Directory where the migration files are stored
const backupDir = path.join(__dirname, '../backups/migration');

/**
 * Helper function to find the most recent transformed file
 */
function findLatestTransformedFile() {
  // List all files in the backup directory
  const files = fs.readdirSync(backupDir);
  
  // Find all firebase-import-*.json files
  const importFiles = files.filter(file => file.startsWith('firebase-import-') && file.endsWith('.json'));
  
  if (importFiles.length === 0) {
    throw new Error('No transformed files found in backups directory');
  }
  
  // Sort by filename (which includes timestamp)
  importFiles.sort().reverse();
  
  // Return the most recent file
  return path.join(backupDir, importFiles[0]);
}

/**
 * Helper function to convert ISO date strings to Timestamps
 */
function convertDates(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'string' && obj.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    // This looks like an ISO date string
    return Timestamp.fromDate(new Date(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertDates(item));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertDates(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Simple import function to import data to Firebase
 */
async function importData() {
  try {
    console.log('🔥 Simple Firebase Import Tool');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Firebase initialized');
    
    // Find the latest transformed file
    const latestFile = findLatestTransformedFile();
    console.log(`Using latest transformed file: ${latestFile}`);
    
    // Read the transformed data
    const rawData = fs.readFileSync(latestFile, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('Data loaded. Starting import...');
    
    // Import peptides
    console.log('Importing peptides...');
    let successCount = 0;
    let errorCount = 0;
    
    // Import peptides collection
    for (const [peptideId, peptideData] of Object.entries(data.peptides)) {
      try {
        // Convert dates to Firestore Timestamps
        const processedData = convertDates(peptideData);
        
        // Set the document
        await setDoc(doc(db, 'peptides', peptideId), processedData);
        
        console.log(`Imported peptide: ${peptideData.name} (${peptideId})`);
        successCount++;
      } catch (error) {
        console.error(`Error importing peptide ${peptideId}:`, error);
        errorCount++;
      }
    }
    
    // Import inventory_peptides collection
    console.log('\nImporting inventory peptides...');
    for (const [id, itemData] of Object.entries(data.inventory_peptides)) {
      try {
        // Convert dates to Firestore Timestamps
        const processedData = convertDates(itemData);
        
        // Set the document
        await setDoc(doc(db, 'inventory_peptides', id), processedData);
        
        console.log(`Imported inventory peptide: ${itemData.name} (${id})`);
        successCount++;
      } catch (error) {
        console.error(`Error importing inventory peptide ${id}:`, error);
        errorCount++;
      }
    }
    
    // Import inventory_bac_water collection
    console.log('\nImporting BAC water...');
    for (const [id, itemData] of Object.entries(data.inventory_bac_water)) {
      try {
        // Convert dates to Firestore Timestamps
        const processedData = convertDates(itemData);
        
        // Set the document
        await setDoc(doc(db, 'inventory_bac_water', id), processedData);
        
        console.log(`Imported BAC water: ${id}`);
        successCount++;
      } catch (error) {
        console.error(`Error importing BAC water ${id}:`, error);
        errorCount++;
      }
    }
    
    // Import inventory_syringes collection
    if (Object.keys(data.inventory_syringes).length > 0) {
      console.log('\nImporting syringes...');
      for (const [id, itemData] of Object.entries(data.inventory_syringes)) {
        try {
          // Convert dates to Firestore Timestamps
          const processedData = convertDates(itemData);
          
          // Set the document
          await setDoc(doc(db, 'inventory_syringes', id), processedData);
          
          console.log(`Imported syringe: ${id}`);
          successCount++;
        } catch (error) {
          console.error(`Error importing syringe ${id}:`, error);
          errorCount++;
        }
      }
    }
    
    // Import inventory_other_items collection
    if (Object.keys(data.inventory_other_items).length > 0) {
      console.log('\nImporting other items...');
      for (const [id, itemData] of Object.entries(data.inventory_other_items)) {
        try {
          // Convert dates to Firestore Timestamps
          const processedData = convertDates(itemData);
          
          // Set the document
          await setDoc(doc(db, 'inventory_other_items', id), processedData);
          
          console.log(`Imported other item: ${id}`);
          successCount++;
        } catch (error) {
          console.error(`Error importing other item ${id}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log('\n✅ Import completed!');
    console.log(`Successfully imported ${successCount} documents`);
    
    if (errorCount > 0) {
      console.log(`Failed to import ${errorCount} documents`);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Open the app and use the database switcher to toggle to Firebase');
    console.log('2. Test that data appears correctly');
    console.log('3. Try adding and logging peptide doses');
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: 0, errors: 1 };
  }
}

// Run the import function
importData().then(result => {
  console.log(`\nImport summary: ${result.success} succeeded, ${result.errors} failed`);
});