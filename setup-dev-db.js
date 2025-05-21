const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env.production' });

// Function to get environment variables
const getEnvVar = (name, env) => {
  return process.env[`${env}_${name}`] || process.env[name];
};

// Production database connection
const prodSupabase = createClient(
  getEnvVar('SUPABASE_URL', 'PRODUCTION'),
  getEnvVar('SUPABASE_ANON_KEY', 'PRODUCTION')
);

// Development database connection
const devSupabase = createClient(
  getEnvVar('SUPABASE_URL', 'DEVELOPMENT'),
  getEnvVar('SUPABASE_ANON_KEY', 'DEVELOPMENT')
);

async function setupDevDatabase() {
  try {
    console.log('Setting up development database from production data...');
    
    // Step 1: Fetch data from production
    console.log('Fetching peptides from production...');
    const { data: prodPeptides, error: prodError } = await prodSupabase
      .from('peptides')
      .select('*');
    
    if (prodError) throw prodError;
    console.log(`Found ${prodPeptides.length} peptides in production`);
    
    // Save a backup of production data
    fs.writeFileSync(
      path.join(__dirname, 'prod-peptides-backup.json'),
      JSON.stringify(prodPeptides, null, 2)
    );
    console.log('Production data backup saved to prod-peptides-backup.json');
    
    // Step 2: Create test data for development
    // For this example, we'll create copies of the production data but mark them as test data
    const devPeptides = prodPeptides.map(peptide => ({
      ...peptide,
      name: `[TEST] ${peptide.name}`, // Mark test data with [TEST] prefix
    }));
    
    // Step 3: Insert into development database
    for (const peptide of devPeptides) {
      console.log(`Adding test peptide: ${peptide.name}`);
      
      // Check if the test peptide already exists
      const { data: existing } = await devSupabase
        .from('peptides')
        .select('id')
        .eq('name', peptide.name)
        .single();
      
      if (existing) {
        console.log(`Test peptide ${peptide.name} already exists, updating...`);
        const { error: updateError } = await devSupabase
          .from('peptides')
          .update(peptide)
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await devSupabase
          .from('peptides')
          .insert(peptide);
        
        if (insertError) throw insertError;
      }
    }
    
    console.log('Development database setup complete!');
  } catch (error) {
    console.error('Error setting up development database:', error);
  }
}

setupDevDatabase();