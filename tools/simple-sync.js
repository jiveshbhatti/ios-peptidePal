// Simple version of the sync script that attempts to work around case sensitivity issues
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

async function simpleSyncData() {
  console.log(`🔄 Simple Sync Tool - Syncing from ${PROD_DB.label} to ${DEV_DB.label}...`);

  // Create clients
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  const devClient = createClient(DEV_DB.url, DEV_DB.key);

  try {
    // 1. Fetch peptides from production
    console.log('📤 Fetching peptides from production...');
    const { data: prodPeptides, error: prodError } = await prodClient
      .from('peptides')
      .select('*');

    if (prodError) {
      console.error('❌ Error fetching production data:', prodError.message);
      return;
    }

    console.log(`✅ Found ${prodPeptides.length} peptides in production`);

    // 2. Clean up existing test peptides in development
    const testNames = prodPeptides.map(p => 
      p.name.startsWith('[TEST]') ? p.name : `[TEST] ${p.name}`
    );
    
    console.log('🗑️  Removing existing test peptides...');
    for (const name of testNames) {
      try {
        await devClient.from('peptides').delete().eq('name', name);
      } catch (err) {
        // Ignore errors during cleanup
      }
    }

    // 3. Prepare simplified peptides for insertion
    console.log('📥 Preparing simplified peptide data...');
    const simplePeptides = prodPeptides.map(peptide => {
      // Create a simplified object with only essential fields and lowercase column names
      return {
        id: peptide.id,
        name: peptide.name.startsWith('[TEST]') ? peptide.name : `[TEST] ${peptide.name}`,
        strength: peptide.strength || '',
        dosageunit: peptide.dosageUnit || '', // lowercase for PostgreSQL
        typicaldosageunits: peptide.typicalDosageUnits || 0, // lowercase for PostgreSQL
        schedule: peptide.schedule || {},
        vials: peptide.vials || [],
        doselogs: peptide.doseLogs || [] // lowercase for PostgreSQL
      };
    });

    // 4. Insert peptides one by one
    console.log('📥 Inserting simplified peptides...');
    let successCount = 0;
    
    for (const peptide of simplePeptides) {
      try {
        console.log(`🔄 Attempting to insert "${peptide.name}"...`);
        const { error } = await devClient.from('peptides').insert(peptide);
        
        if (error) {
          console.error(`❌ Failed: ${error.message}`);
        } else {
          console.log(`✅ Success!`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
      }
    }

    // 5. Summary
    console.log(`\n📊 Sync complete: ${successCount} of ${simplePeptides.length} peptides synced successfully`);
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the sync
simpleSyncData();