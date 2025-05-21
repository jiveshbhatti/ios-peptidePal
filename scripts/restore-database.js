#!/usr/bin/env node

/**
 * PeptidePal Database Restore Script
 * 
 * This script restores data from a backup to the Supabase database.
 * It has an interactive mode for selecting which backup to restore.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import the correct credentials from the app's config
const PROD_SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const PROD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

// Initialize Supabase client for Node.js
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
};

const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_KEY, options);

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// List available backups
function listBackups() {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    console.log('No backups found. Backup directory does not exist.');
    return [];
  }
  
  // Read directories in backups folder
  const backups = fs.readdirSync(backupDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
    .map(dirent => dirent.name)
    .sort()
    .reverse(); // Most recent first
    
  if (backups.length === 0) {
    console.log('No backups found.');
    return [];
  }
  
  console.log('Available backups:');
  backups.forEach((backup, index) => {
    try {
      const metadataPath = path.join(backupDir, backup, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const tableCount = Object.keys(metadata.recordCounts).length;
        const totalRecords = Object.values(metadata.recordCounts).reduce((sum, count) => sum + count, 0);
        console.log(`${index + 1}. ${backup} - ${tableCount} tables, ${totalRecords} total records`);
      } else {
        console.log(`${index + 1}. ${backup} (no metadata available)`);
      }
    } catch (error) {
      console.log(`${index + 1}. ${backup} (error reading metadata)`);
    }
  });
  
  return backups;
}

// Restore from a specific backup
async function restoreFromBackup(backupName, tablesToRestore = null) {
  const backupDir = path.join(__dirname, '../backups');
  const backupPath = path.join(backupDir, backupName);
  
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup ${backupName} not found.`);
    return { success: false, error: 'Backup not found' };
  }
  
  console.log(`Restoring from backup: ${backupName}`);
  
  // Check what tables are available in this backup
  const backupFiles = fs.readdirSync(backupPath)
    .filter(file => file.endsWith('.json') && file !== 'metadata.json')
    .map(file => file.replace('.json', ''));
    
  if (backupFiles.length === 0) {
    console.error('No table backups found in this backup.');
    return { success: false, error: 'No table backups found' };
  }
  
  // Filter tables if specified
  const tablesToProcess = tablesToRestore ? 
    backupFiles.filter(table => tablesToRestore.includes(table)) : 
    backupFiles;
    
  if (tablesToProcess.length === 0) {
    console.error('No matching tables found to restore.');
    return { success: false, error: 'No matching tables' };
  }
  
  console.log(`Found ${tablesToProcess.length} tables to restore: ${tablesToProcess.join(', ')}`);
  
  // Proceed with restore
  const results = { success: true, tableResults: {} };
  
  for (const table of tablesToProcess) {
    console.log(`\nRestoring ${table}...`);
    
    try {
      // Read backup data
      const backupFilePath = path.join(backupPath, `${table}.json`);
      const tableData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
      
      if (!tableData || tableData.length === 0) {
        console.log(`No data for ${table}, skipping.`);
        results.tableResults[table] = { success: true, message: 'No data to restore' };
        continue;
      }
      
      console.log(`Loaded ${tableData.length} records for ${table}`);
      
      // First clear the existing data - ONLY if there's data to restore
      console.log(`Clearing existing data from ${table}...`);
      const { error: clearError } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null); // Safe delete - only delete rows with an ID
        
      if (clearError) {
        console.error(`Error clearing existing data from ${table}:`, clearError);
        results.tableResults[table] = { success: false, error: clearError };
        continue;
      }
      
      console.log(`Existing data cleared successfully`);
      
      // Insert the backup data in chunks to avoid request size limits
      const CHUNK_SIZE = 20; // Keep chunks small to avoid request size limits
      let successCount = 0;
      let errorCount = 0;
      
      console.log(`Inserting data in chunks of ${CHUNK_SIZE}...`);
      
      for (let i = 0; i < tableData.length; i += CHUNK_SIZE) {
        const chunk = tableData.slice(i, i + CHUNK_SIZE);
        
        // Log progress
        const progressPct = Math.round((i / tableData.length) * 100);
        process.stdout.write(`Progress: ${progressPct}% (${i}/${tableData.length})\r`);
        
        const { error: insertError } = await supabase
          .from(table)
          .insert(chunk);
          
        if (insertError) {
          console.error(`\nError inserting data chunk into ${table}:`, insertError);
          errorCount += chunk.length;
        } else {
          successCount += chunk.length;
        }
      }
      
      console.log(`\nRestored ${successCount}/${tableData.length} records to ${table}`);
      
      results.tableResults[table] = { 
        success: errorCount === 0,
        records: tableData.length,
        restored: successCount,
        failed: errorCount
      };
      
    } catch (error) {
      console.error(`Error restoring ${table}:`, error);
      results.tableResults[table] = { success: false, error };
    }
  }
  
  console.log('\nRestore operation completed!');
  
  // Print summary
  console.log('\nRestore Summary:');
  let overallSuccess = true;
  
  for (const table in results.tableResults) {
    const result = results.tableResults[table];
    if (result.success) {
      console.log(`✓ ${table}: ${result.restored} records restored successfully`);
    } else {
      overallSuccess = false;
      console.log(`✗ ${table}: Failed - ${result.error?.message || 'Unknown error'}`);
    }
  }
  
  return { ...results, success: overallSuccess };
}

// Interactive restore process
async function interactiveRestore() {
  try {
    const backups = listBackups();
    
    if (backups.length === 0) {
      rl.close();
      return;
    }
    
    const backupSelection = await new Promise(resolve => {
      rl.question('\nEnter the number of the backup to restore (or "q" to quit): ', resolve);
    });
    
    if (backupSelection.toLowerCase() === 'q') {
      console.log('Exiting without restore.');
      rl.close();
      return;
    }
    
    const selection = parseInt(backupSelection);
    if (isNaN(selection) || selection < 1 || selection > backups.length) {
      console.log('Invalid selection. Please try again.');
      rl.close();
      return;
    }
    
    const selectedBackup = backups[selection - 1];
    
    // Ask which tables to restore
    console.log('\nWhich tables would you like to restore?');
    console.log('1. All tables');
    console.log('2. Only peptides table');
    console.log('3. Only inventory tables');
    console.log('4. Specific tables');
    
    const tableSelection = await new Promise(resolve => {
      rl.question('Enter your choice (1-4): ', resolve);
    });
    
    let tablesToRestore = null;
    
    if (tableSelection === '2') {
      tablesToRestore = ['peptides'];
    } else if (tableSelection === '3') {
      tablesToRestore = ['inventory_peptides', 'inventory_bac_water', 'inventory_syringes', 'inventory_other_items'];
    } else if (tableSelection === '4') {
      const availableTables = fs.readdirSync(path.join(__dirname, '../backups', selectedBackup))
        .filter(file => file.endsWith('.json') && file !== 'metadata.json')
        .map(file => file.replace('.json', ''));
        
      console.log('\nAvailable tables:');
      availableTables.forEach((table, i) => console.log(`${i + 1}. ${table}`));
      
      const tableInput = await new Promise(resolve => {
        rl.question('Enter table numbers separated by commas (e.g., 1,3,4): ', resolve);
      });
      
      const selectedTables = tableInput.split(',').map(num => {
        const index = parseInt(num.trim()) - 1;
        return index >= 0 && index < availableTables.length ? availableTables[index] : null;
      }).filter(table => table !== null);
      
      if (selectedTables.length === 0) {
        console.log('No valid tables selected. Exiting.');
        rl.close();
        return;
      }
      
      tablesToRestore = selectedTables;
    }
    
    // Final confirmation
    console.log('\n⚠️ WARNING: This will overwrite existing data in the database! ⚠️');
    const confirmation = await new Promise(resolve => {
      rl.question('Are you sure you want to proceed with the restore? (yes/no): ', resolve);
    });
    
    if (confirmation.toLowerCase() !== 'yes') {
      console.log('Restore cancelled.');
      rl.close();
      return;
    }
    
    const result = await restoreFromBackup(selectedBackup, tablesToRestore);
    
    if (result.success) {
      console.log('\n✅ Restore completed successfully!');
    } else {
      console.log('\n❌ Restore completed with errors. Check the logs above for details.');
    }
    
    rl.close();
    
  } catch (error) {
    console.error('Error during interactive restore:', error);
    rl.close();
  }
}

// Execute interactive restore when run directly
if (require.main === module) {
  interactiveRestore();
} else {
  // Export for use in other scripts
  module.exports = { listBackups, restoreFromBackup };
}