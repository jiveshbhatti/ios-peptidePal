const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./peptidepal-8e8ea-firebase-adminsdk-hftoe-4e6c4e7531.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://peptidepal-8e8ea-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function checkGlowPeptideData() {
  console.log('=== Checking Glow Peptide Data in Firebase ===\n');
  
  try {
    // 1. Check main peptides collection
    console.log('1. Checking peptides collection for Glow:');
    console.log('----------------------------------------');
    
    const peptideSnapshot = await db.collection('peptides')
      .where('name', '==', 'Glow')
      .get();
    
    if (peptideSnapshot.empty) {
      console.log('No Glow peptide found in peptides collection\n');
    } else {
      peptideSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Document ID: ${doc.id}`);
        console.log('\nFull document data:');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n--- BAC Water Related Fields ---');
        console.log(`bacWaterVolumePerVialMl: ${data.bacWaterVolumePerVialMl || 'NOT FOUND'}`);
        console.log(`defaultBacWaterVolumeMl: ${data.defaultBacWaterVolumeMl || 'NOT FOUND'}`);
        console.log(`amountPerVialMg: ${data.amountPerVialMg || 'NOT FOUND'}`);
        console.log(`concentrationMgPerMl: ${data.concentrationMgPerMl || 'NOT FOUND'}`);
        
        if (data.vials && data.vials.length > 0) {
          console.log('\n--- Vials Information ---');
          data.vials.forEach((vial, index) => {
            console.log(`\nVial ${index + 1}:`);
            console.log(`  ID: ${vial.id}`);
            console.log(`  bacWaterVolumeMl: ${vial.bacWaterVolumeMl || 'NOT FOUND'}`);
            console.log(`  reconstitutedDate: ${vial.reconstitutedDate}`);
            console.log(`  initialAmountUnits: ${vial.initialAmountUnits}`);
            console.log(`  remainingAmountUnits: ${vial.remainingAmountUnits}`);
            console.log(`  status: ${vial.status}`);
          });
        }
      });
    }
    
    // 2. Check inventory peptides collection
    console.log('\n\n2. Checking inventory/peptides for Glow:');
    console.log('----------------------------------------');
    
    const inventorySnapshot = await db.collection('inventory').doc('peptides').get();
    
    if (!inventorySnapshot.exists) {
      console.log('No inventory/peptides document found\n');
    } else {
      const inventoryData = inventorySnapshot.data();
      
      // Look for Glow in the inventory data
      let glowFound = false;
      
      // Check if it's an array or object structure
      if (Array.isArray(inventoryData)) {
        const glowItems = inventoryData.filter(item => item.name === 'Glow');
        if (glowItems.length > 0) {
          glowFound = true;
          console.log('Found Glow in inventory array:');
          glowItems.forEach(item => {
            console.log(JSON.stringify(item, null, 2));
          });
        }
      } else {
        // Check if it's nested in peptides array
        if (inventoryData.peptides && Array.isArray(inventoryData.peptides)) {
          const glowItems = inventoryData.peptides.filter(item => item.name === 'Glow');
          if (glowItems.length > 0) {
            glowFound = true;
            console.log('Found Glow in inventory.peptides array:');
            glowItems.forEach(item => {
              console.log(JSON.stringify(item, null, 2));
              
              console.log('\n--- Inventory BAC Water Fields ---');
              console.log(`defaultBacWaterVolumeMl: ${item.defaultBacWaterVolumeMl || 'NOT FOUND'}`);
              console.log(`amountPerVialMg: ${item.amountPerVialMg || 'NOT FOUND'}`);
            });
          }
        }
        
        // Check other possible structures
        Object.keys(inventoryData).forEach(key => {
          if (inventoryData[key] && inventoryData[key].name === 'Glow') {
            glowFound = true;
            console.log(`Found Glow under key '${key}':`);
            console.log(JSON.stringify(inventoryData[key], null, 2));
          }
        });
      }
      
      if (!glowFound) {
        console.log('No Glow peptide found in inventory document');
        console.log('\nInventory document structure:');
        console.log(JSON.stringify(Object.keys(inventoryData), null, 2));
      }
    }
    
    // 3. Additional check - direct document query by ID if we know it
    console.log('\n\n3. Checking for Glow by potential document IDs:');
    console.log('-----------------------------------------------');
    
    // Try common ID patterns
    const potentialIds = ['glow', 'Glow', 'GLOW'];
    
    for (const id of potentialIds) {
      const doc = await db.collection('peptides').doc(id).get();
      if (doc.exists) {
        console.log(`Found document with ID '${id}':`);
        const data = doc.data();
        console.log(JSON.stringify(data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error checking Glow peptide data:', error);
  } finally {
    // Clean up
    await admin.app().delete();
    console.log('\n=== Check completed ===');
  }
}

// Run the check
checkGlowPeptideData();