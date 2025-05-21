// Script to sync data from all tables from production to development
const { createClient } = require('@supabase/supabase-js');

// Database configurations
const PROD_DB = {
  url: 'https://yawjzpovpfccgisrrfjo.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o',
  label: 'PRODUCTION'
};

const DEV_DB = {
  url: 'https://looltsvagvvjnspayhym.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw',
  label: 'DEVELOPMENT'
};

// List of tables to sync
const TABLES = [
  'peptides',
  'inventory_peptides',
  'inventory_bac_water',
  'inventory_syringes',
  'inventory_other_items',
  'health_metric_logs'
];

// Tables that need [TEST] prefix on name field
const TEST_PREFIX_TABLES = [
  'peptides', 
  'inventory_peptides', 
  'inventory_other_items'
];

// Wait function to avoid overwhelming the database
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Lowercase keys in an object
function lowercaseKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  );
}

async function syncAllTables() {
  console.log(`🔄 PeptidePal - Syncing All Tables`);
  console.log(`==============================`);
  console.log(`From: ${PROD_DB.label}`);
  console.log(`To: ${DEV_DB.label}`);
  
  // Create clients
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  const devClient = createClient(DEV_DB.url, DEV_DB.key);
  
  // Process each table
  let totalSuccessCount = 0;
  let totalFailCount = 0;
  
  for (const tableName of TABLES) {
    console.log(`\n📋 Processing table: ${tableName}`);
    
    try {
      // 1. Fetch data from production
      console.log(`Fetching data from production...`);
      const { data: prodData, error: fetchError } = await prodClient
        .from(tableName)
        .select('*');
      
      if (fetchError) {
        console.error(`❌ Error fetching data: ${fetchError.message}`);
        continue;
      }
      
      if (!prodData || prodData.length === 0) {
        console.log(`ℹ️ No data in ${tableName} table`);
        continue;
      }
      
      console.log(`Found ${prodData.length} rows in ${tableName}`);
      
      // 2. Transform data for development
      const needsTestPrefix = TEST_PREFIX_TABLES.includes(tableName);
      
      const devData = prodData.map(item => {
        // Convert all keys to lowercase
        const lowercaseItem = lowercaseKeys(item);
        
        // Add [TEST] prefix to name if needed
        if (needsTestPrefix && lowercaseItem.name) {
          lowercaseItem.name = lowercaseItem.name.startsWith('[TEST]') 
            ? lowercaseItem.name 
            : `[TEST] ${lowercaseItem.name}`;
        }
        
        return lowercaseItem;
      });
      
      // 3. Delete existing test data
      if (needsTestPrefix) {
        console.log(`Cleaning up existing test data...`);
        for (const item of devData) {
          try {
            await devClient
              .from(tableName)
              .delete()
              .eq('name', item.name);
            
            // Small pause to avoid overwhelming the database
            await wait(50);
          } catch (deleteError) {
            console.warn(`⚠️ Cleanup error: ${deleteError.message}`);
            // Continue anyway
          }
        }
      }
      
      // 4. Insert data into development
      console.log(`Inserting data into ${tableName}...`);
      let successCount = 0;
      let failCount = 0;
      
      for (const item of devData) {
        try {
          // Insert with lowercase keys
          const { error: insertError } = await devClient
            .from(tableName)
            .insert(item);
          
          if (insertError) {
            console.error(`❌ Error inserting row: ${insertError.message}`);
            failCount++;
          } else {
            successCount++;
            
            // Log progress every 5 items
            if (successCount % 5 === 0) {
              console.log(`Progress: ${successCount}/${devData.length}`);
            }
          }
          
          // Small pause to avoid overwhelming the database
          await wait(100);
          
        } catch (error) {
          console.error(`❌ Error processing row: ${error.message}`);
          failCount++;
        }
      }
      
      // Update totals
      totalSuccessCount += successCount;
      totalFailCount += failCount;
      
      // 5. Report results for this table
      console.log(`Table ${tableName}: ${successCount} successful, ${failCount} failed`);
      
    } catch (error) {
      console.error(`❌ Error processing ${tableName}: ${error.message}`);
    }
  }
  
  // Overall report
  console.log(`\n🏁 Sync Completed`);
  console.log(`================`);
  console.log(`Total successful: ${totalSuccessCount}`);
  console.log(`Total failed: ${totalFailCount}`);
  
  if (totalFailCount > 0) {
    console.log(`\n⚠️ Some items failed to sync. Possible reasons:`);
    console.log(`1. Table might not exist in development database`);
    console.log(`2. Schema differences between production and development`);
    console.log(`3. Column case sensitivity issues (they should be lowercase)`);
    console.log(`\nTry running the SQL schema setup script first in the Supabase SQL Editor.`);
  } else if (totalSuccessCount > 0) {
    console.log(`\n✅ All data synced successfully!`);
  } else {
    console.log(`\n⚠️ No data was synced. Please check the logs for errors.`);
  }
}

// Run the sync
syncAllTables().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
});