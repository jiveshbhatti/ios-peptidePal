// Script to restore peptides data from backup
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

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

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function restoreFromBackup(backupFilePath = './backups/peptides-backup-latest.json') {
  try {
    console.log(`Starting restoration from backup: ${backupFilePath}`);
    
    // Check if backup file exists
    if (!fs.existsSync(backupFilePath)) {
      console.error(`Backup file not found: ${backupFilePath}`);
      rl.close();
      return;
    }
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    console.log(`Backup file loaded. Contains ${backupData.peptides.length} peptides and ${backupData.inventory_peptides.length} inventory peptides`);
    console.log(`Backup timestamp: ${backupData.timestamp}`);
    
    // Ask for confirmation before proceeding
    rl.question('Are you sure you want to restore from this backup? THIS WILL OVERWRITE CURRENT DATA! (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restoration cancelled');
        rl.close();
        return;
      }
      
      console.log('Starting restoration process...');
      
      // Restore peptides - update each peptide individually
      console.log(`Restoring ${backupData.peptides.length} peptides...`);
      
      for (const peptide of backupData.peptides) {
        const { error } = await supabase
          .from('peptides')
          .update(peptide)
          .eq('id', peptide.id);
          
        if (error) {
          console.error(`Error restoring peptide ${peptide.id}:`, error);
        }
      }
      
      // Restore inventory peptides - update each inventory peptide individually
      console.log(`Restoring ${backupData.inventory_peptides.length} inventory peptides...`);
      
      for (const inventoryPeptide of backupData.inventory_peptides) {
        const { error } = await supabase
          .from('inventory_peptides')
          .update(inventoryPeptide)
          .eq('id', inventoryPeptide.id);
          
        if (error) {
          console.error(`Error restoring inventory peptide ${inventoryPeptide.id}:`, error);
        }
      }
      
      console.log('Restoration completed!');
      rl.close();
    });
    
  } catch (error) {
    console.error('Error restoring from backup:', error);
    rl.close();
  }
}

// Get backup file path from command line args or use default
const backupFilePath = process.argv[2] || './backups/peptides-backup-latest.json';

// Run the script
restoreFromBackup(backupFilePath);