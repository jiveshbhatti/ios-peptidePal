/**
 * Verify Migration
 * 
 * This script verifies that data was successfully migrated to Firebase
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc,
  collectionGroup,
  query,
  orderBy
} = require('firebase/firestore');

console.log('VERIFYING FIREBASE MIGRATION');

// Enable App Check debug token
if (typeof global !== 'undefined') {
  global.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

async function verifyMigration() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized');
    
    // Check peptides collection
    console.log('\nChecking peptides collection...');
    const peptidesSnapshot = await getDocs(collection(db, 'peptides'));
    
    if (peptidesSnapshot.empty) {
      console.log('❌ No peptides found in Firebase!');
      return false;
    }
    
    console.log(`✅ Found ${peptidesSnapshot.size} peptides in Firebase:`);
    
    let totalVials = 0;
    let totalDoseLogs = 0;
    
    // Check each peptide
    for (const peptideDoc of peptidesSnapshot.docs) {
      const peptideData = peptideDoc.data();
      console.log(`\nPeptide: ${peptideData.name} (${peptideDoc.id})`);
      console.log(`  Strength: ${peptideData.strength}`);
      console.log(`  Dosage Unit: ${peptideData.dosageUnit}`);
      
      // Check vials subcollection
      const vialsSnapshot = await getDocs(collection(peptideDoc.ref, 'vials'));
      console.log(`  Vials: ${vialsSnapshot.size}`);
      totalVials += vialsSnapshot.size;
      
      // Print vial details
      if (vialsSnapshot.size > 0) {
        vialsSnapshot.forEach(vialDoc => {
          const vialData = vialDoc.data();
          console.log(`    - Vial ${vialDoc.id}: ${vialData.isActive ? 'Active' : 'Inactive'}`);
          if (vialData.initialAmountUnits) {
            console.log(`      Initial: ${vialData.initialAmountUnits}, Remaining: ${vialData.remainingAmountUnits}`);
          }
        });
      }
      
      // Check doseLogs subcollection
      const doseLogsSnapshot = await getDocs(
        query(collection(peptideDoc.ref, 'doseLogs'), orderBy('date', 'desc'))
      );
      
      console.log(`  Dose Logs: ${doseLogsSnapshot.size}`);
      totalDoseLogs += doseLogsSnapshot.size;
      
      // Print recent dose logs
      if (doseLogsSnapshot.size > 0) {
        // Only show up to 3 most recent logs
        const showCount = Math.min(doseLogsSnapshot.size, 3);
        console.log(`    (Showing ${showCount} most recent logs)`);
        
        let count = 0;
        doseLogsSnapshot.forEach(logDoc => {
          if (count < showCount) {
            const logData = logDoc.data();
            const date = logData.date?.toDate?.() || new Date();
            console.log(`    - Log ${logDoc.id}: ${date.toLocaleDateString()} (${logData.dosage} ${logData.unit})`);
            count++;
          }
        });
      }
    }
    
    // Summary
    console.log('\nMIGRATION VERIFICATION SUMMARY:');
    console.log(`✅ Total Peptides: ${peptidesSnapshot.size}`);
    console.log(`✅ Total Vials: ${totalVials}`);
    console.log(`✅ Total Dose Logs: ${totalDoseLogs}`);
    console.log('\nMigration appears to be SUCCESSFUL.');
    console.log('The app should now be able to use Firebase as the database backend.');
    
    return true;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

// Run the verification
verifyMigration();