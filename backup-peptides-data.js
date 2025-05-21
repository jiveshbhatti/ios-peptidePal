// Script to backup peptides table data before making changes
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Import the correct credentials from the app's config
const PROD_SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const PROD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || PROD_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || PROD_SUPABASE_KEY;

// For running in Node.js environment without React Native
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
};

const supabase = createClient(supabaseUrl, supabaseKey, options);

async function backupPeptidesData() {
  try {
    console.log('Starting backup of peptides data...');
    
    // Get all peptides
    const { data: peptides, error: pepError } = await supabase
      .from('peptides')
      .select('*');
      
    if (pepError) throw pepError;
    console.log(`Found ${peptides.length} peptides to backup`);
    
    // Get all inventory peptides
    const { data: inventoryPeptides, error: invError } = await supabase
      .from('inventory_peptides')
      .select('*');
      
    if (invError) throw invError;
    console.log(`Found ${inventoryPeptides.length} inventory peptides to backup`);
    
    // Create backup directory if it doesn't exist
    const backupDir = './backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Create a timestamped backup file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = `${backupDir}/peptides-backup-${timestamp}.json`;
    
    // Write backup data
    fs.writeFileSync(
      backupFile,
      JSON.stringify({
        peptides,
        inventory_peptides: inventoryPeptides,
        timestamp,
        metadata: {
          description: 'Backup before dose log reconstruction',
          peptides_count: peptides.length,
          inventory_peptides_count: inventoryPeptides.length
        }
      }, null, 2)
    );
    
    console.log(`Backup completed successfully. File saved to: ${backupFile}`);
    
    // Create a specifically named backup for easier reference
    const latestBackupFile = `${backupDir}/peptides-backup-latest.json`;
    fs.writeFileSync(latestBackupFile, fs.readFileSync(backupFile));
    console.log(`Also saved backup to: ${latestBackupFile}`);
    
  } catch (error) {
    console.error('Error backing up peptides data:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    if (error.cause) {
      console.error('Root cause:', error.cause);
    }
  }
}

// Run the script
backupPeptidesData();