/**
 * Verify Inventory Migration
 * 
 * This script verifies that inventory data was successfully migrated to Firebase
 */
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs
} = require('firebase/firestore');

console.log('VERIFYING INVENTORY DATA MIGRATION');

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

async function verifyInventoryMigration() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized');
    
    // Check inventory_peptides collection
    console.log('\nChecking inventory_peptides collection...');
    const invPeptidesSnapshot = await getDocs(collection(db, 'inventory_peptides'));
    
    if (invPeptidesSnapshot.empty) {
      console.log('❌ No inventory peptides found in Firebase!');
    } else {
      console.log(`✅ Found ${invPeptidesSnapshot.size} inventory peptides in Firebase:`);
      
      invPeptidesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name} (${doc.id})`);
        console.log(`  Vials: ${data.num_vials}`);
        console.log(`  Concentration: ${data.concentration_per_vial_mcg || 0}mcg/vial`);
        if (data.active_vial_status) {
          console.log(`  Active Vial Status: ${data.active_vial_status}`);
        }
      });
    }
    
    // Check inventory_bac_water collection
    console.log('\nChecking inventory_bac_water collection...');
    const bacWaterSnapshot = await getDocs(collection(db, 'inventory_bac_water'));
    
    if (bacWaterSnapshot.empty) {
      console.log('❌ No BAC water items found in Firebase!');
    } else {
      console.log(`✅ Found ${bacWaterSnapshot.size} BAC water items in Firebase:`);
      
      bacWaterSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.volume_ml_per_bottle}ml per bottle (${doc.id})`);
        console.log(`  Bottles: ${data.num_bottles}`);
        if (data.expiry_date) {
          const expiryDate = data.expiry_date.toDate?.() || new Date(data.expiry_date);
          console.log(`  Expiry: ${expiryDate.toLocaleDateString()}`);
        }
      });
    }
    
    // Check inventory_syringes collection
    console.log('\nChecking inventory_syringes collection...');
    const syringesSnapshot = await getDocs(collection(db, 'inventory_syringes'));
    
    if (syringesSnapshot.empty) {
      console.log('❌ No syringes found in Firebase!');
    } else {
      console.log(`✅ Found ${syringesSnapshot.size} syringe types in Firebase:`);
      
      syringesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.type_size} (${doc.id})`);
        console.log(`  Quantity: ${data.quantity}`);
        if (data.brand) {
          console.log(`  Brand: ${data.brand}`);
        }
      });
    }
    
    // Check inventory_other_items collection
    console.log('\nChecking inventory_other_items collection...');
    const otherItemsSnapshot = await getDocs(collection(db, 'inventory_other_items'));
    
    if (otherItemsSnapshot.empty) {
      console.log('❌ No other inventory items found in Firebase!');
    } else {
      console.log(`✅ Found ${otherItemsSnapshot.size} other inventory items in Firebase:`);
      
      otherItemsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.item_name} (${doc.id})`);
        console.log(`  Quantity: ${data.quantity}`);
        if (data.description) {
          console.log(`  Description: ${data.description}`);
        }
      });
    }
    
    // Summary
    console.log('\nINVENTORY MIGRATION VERIFICATION SUMMARY:');
    console.log(`✅ Inventory Peptides: ${invPeptidesSnapshot.size}`);
    console.log(`✅ BAC Water Items: ${bacWaterSnapshot.size}`);
    console.log(`✅ Syringes: ${syringesSnapshot.size}`);
    console.log(`✅ Other Items: ${otherItemsSnapshot.size}`);
    
    if (invPeptidesSnapshot.size > 0 || bacWaterSnapshot.size > 0) {
      console.log('\nMigration appears to be SUCCESSFUL.');
      console.log('The app should now be able to use the inventory features with Firebase as the database backend.');
    } else {
      console.log('\nMigration may not be complete. Please check the Supabase exports and try again.');
    }
    
    return true;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

// Run the verification
verifyInventoryMigration();