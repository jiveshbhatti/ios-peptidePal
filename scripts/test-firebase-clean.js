/**
 * Test Firebase Clean Implementation
 * 
 * This script tests the clean Firebase implementation directly.
 */

// Enable debug token for development
global.self = {};
global.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// Import the clean Firebase service
const firebaseCleanService = require('../src/services/firebase-clean').default;

async function testCleanImplementation() {
  console.log('===== TESTING CLEAN FIREBASE IMPLEMENTATION =====');
  
  try {
    // Test getPeptides()
    console.log('\n1. Testing getPeptides()...');
    const peptides = await firebaseCleanService.getPeptides();
    console.log(`✅ Successfully fetched ${peptides.length} peptides`);
    
    if (peptides.length > 0) {
      console.log(`First peptide: ${peptides[0].name}`);
    }
    
    // Test getInventoryPeptides()
    console.log('\n2. Testing getInventoryPeptides()...');
    const inventoryPeptides = await firebaseCleanService.getInventoryPeptides();
    console.log(`✅ Successfully fetched ${inventoryPeptides.length} inventory peptides`);
    
    if (inventoryPeptides.length > 0) {
      console.log(`First inventory peptide: ${inventoryPeptides[0].name}`);
    }
    
    // Test getInventoryBacWater()
    console.log('\n3. Testing getInventoryBacWater()...');
    const bacWater = await firebaseCleanService.getInventoryBacWater();
    console.log(`✅ Successfully fetched ${bacWater.length} bac water items`);
    
    // Test getInventorySyringes()
    console.log('\n4. Testing getInventorySyringes()...');
    const syringes = await firebaseCleanService.getInventorySyringes();
    console.log(`✅ Successfully fetched ${syringes.length} syringes items`);
    
    // Test getInventoryOtherItems()
    console.log('\n5. Testing getInventoryOtherItems()...');
    const otherItems = await firebaseCleanService.getInventoryOtherItems();
    console.log(`✅ Successfully fetched ${otherItems.length} other items`);
    
    console.log('\n===== TEST COMPLETED SUCCESSFULLY =====');
    console.log('The clean Firebase implementation is working perfectly!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);
  }
}

// Run the test
testCleanImplementation();