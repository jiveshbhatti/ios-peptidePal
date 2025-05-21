// Node.js script to sync data between production and development databases
// Uses the Supabase JavaScript client for better reliability

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

async function syncData() {
  console.log(`🔄 Syncing data from ${PROD_DB.label} to ${DEV_DB.label}...`);

  // Create clients
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  const devClient = createClient(DEV_DB.url, DEV_DB.key);

  try {
    // 1. Get available columns in development database
    console.log('📋 Checking development database schema...');
    
    // Declare the availableColumns variable at this scope so it's accessible later
    let availableColumns = ['id', 'name', 'strength', 'dosageunit', 'typicaldosageunits', 
                           'schedule', 'vials', 'doselogs', 'imageurl', 'dataaihint', 
                           'notes', 'startdate'];
    
    // Try a direct query to the peptides table to detect columns
    try {
      const { data: sampleData, error: sampleError } = await devClient
        .from('peptides')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Error accessing peptides table:', sampleError.message);
        
        // Check if the table exists at all
        if (sampleError.message.includes('does not exist')) {
          console.error('❌ The peptides table does not exist. Please run the schema setup script first.');
          return;
        }
        
        // Continue with hardcoded list of essential columns
        console.log('⚠️  Using default column list due to schema access issues');
        console.log(`✓ Using ${availableColumns.length} expected columns`);
      } else {
        // If we got sample data, extract the column names
        if (sampleData && sampleData.length > 0) {
          availableColumns = Object.keys(sampleData[0]).map(col => col.toLowerCase());
        }
        
        console.log(`✅ Found ${availableColumns.length} columns in development database:`, availableColumns.join(', '));
      }
    } catch (error) {
      console.error('❌ Error detecting schema:', error.message);
      
      // Fall back to hardcoded list of essential columns
      console.log('⚠️  Using default column list due to schema access error');
      console.log(`✓ Using ${availableColumns.length} expected columns`);
    }

    // 2. Fetch peptides from production
    console.log('📤 Fetching peptides from production...');
    const { data: prodPeptides, error: prodError } = await prodClient
      .from('peptides')
      .select('*');

    if (prodError) {
      console.error('❌ Error fetching production data:', prodError.message);
      return;
    }

    console.log(`✅ Found ${prodPeptides.length} peptides in production`);

    // 3. Delete existing test peptides in development
    console.log('🗑️  Removing existing test peptides in development...');
    for (const peptide of prodPeptides) {
      const testName = peptide.name.startsWith('[TEST]') 
        ? peptide.name 
        : `[TEST] ${peptide.name}`;
      
      const { error: deleteError } = await devClient
        .from('peptides')
        .delete()
        .eq('name', testName);
      
      if (deleteError) {
        console.warn(`⚠️  Could not delete existing "${testName}": ${deleteError.message}`);
      }
    }

    // 4. Insert modified copies into development
    console.log('📥 Inserting test peptides into development...');
    let successCount = 0;
    let failCount = 0;

    for (const peptide of prodPeptides) {
      try {
        // Create copy with [TEST] prefix in name
        const testPeptide = {
          id: peptide.id,
          name: peptide.name.startsWith('[TEST]') ? peptide.name : `[TEST] ${peptide.name}`,
        };

        // Only include fields that exist in development database
        for (const [key, value] of Object.entries(peptide)) {
          if (key !== 'id' && key !== 'name' && availableColumns.includes(key.toLowerCase())) {
            testPeptide[key] = value;
          }
        }

        console.log(`🔄 Inserting "${testPeptide.name}"...`);
        const { error: insertError } = await devClient
          .from('peptides')
          .insert(testPeptide);

        if (insertError) {
          console.error(`❌ Failed to insert "${testPeptide.name}": ${insertError.message}`);
          failCount++;
        } else {
          console.log(`✅ Successfully inserted "${testPeptide.name}"`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing "${peptide.name}": ${error.message}`);
        failCount++;
      }
    }

    // 5. Summary
    console.log('\n📊 Sync Summary');
    console.log('==============');
    console.log(`✅ Successfully inserted: ${successCount} peptides`);
    console.log(`❌ Failed to insert: ${failCount} peptides`);

    if (successCount > 0) {
      console.log('\n🎉 Sync completed successfully!');
    } else {
      console.log('\n⚠️  Sync completed with issues - no peptides were inserted');
    }

  } catch (error) {
    console.error('❌ Unexpected error during sync:', error.message);
  }
}

// Run the sync
syncData();