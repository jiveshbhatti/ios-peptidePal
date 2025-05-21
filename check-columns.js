// Check the actual column names in both databases
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

async function checkDatabase(config) {
  try {
    console.log(`\n\n📊 Checking ${config.label} database columns...`);
    
    // Create client
    const supabase = createClient(config.url, config.key);
    
    // Get peptides table schema
    console.log(`Querying information_schema for peptides table...`);
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'peptides')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error(`❌ Error querying schema: ${error.message}`);
      
      // Try alternate method
      console.log(`Trying to fetch sample data to infer schema...`);
      const { data: sampleData, error: sampleError } = await supabase
        .from('peptides')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error(`❌ Error fetching sample: ${sampleError.message}`);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log(`📋 Inferred columns from sample data:`);
        const columns = Object.keys(sampleData[0]);
        columns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log(`⚠️ No sample data found`);
      }
      
    } else {
      console.log(`📋 Found ${data.length} columns in peptides table:`);
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
    // Additional test - try direct updates with different column names
    const testColumnNames = ['doseLogs', 'doselogs', 'dose_logs'];
    console.log(`\n🧪 Testing column update with different casing...`);
    
    for (const colName of testColumnNames) {
      console.log(`Testing update with column name: "${colName}"`);
      
      // Create a simple update object with current column name
      const update = {};
      update[colName] = []; // Just use an empty array for testing
      
      // Try the update on a non-existent ID to avoid actually changing data
      const { error: updateError } = await supabase
        .from('peptides')
        .update(update)
        .eq('id', '00000000-0000-0000-0000-000000000000');
      
      if (updateError) {
        // If the error mentions column not found, it's likely a casing issue
        if (updateError.message && updateError.message.includes('column') && updateError.message.includes('not found')) {
          console.log(`❌ Column "${colName}" doesn't exist: ${updateError.message}`);
        } else {
          // If we get a different error (like record not found), the column name might be valid
          console.log(`✅ Column "${colName}" might be valid (got different error): ${updateError.message}`);
        }
      } else {
        console.log(`✅ Column "${colName}" exists (no column error)`);
      }
    }
    
  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
  }
}

// Check both databases
async function main() {
  // Check production database
  await checkDatabase(PROD_DB);
  
  // Check development database
  await checkDatabase(DEV_DB);
}

// Run the checks
main().catch(err => console.error(`Fatal error: ${err.message}`));