#!/usr/bin/env node

/**
 * PeptidePal Database Backup Script
 * 
 * This script creates a backup of all important tables in the Supabase database.
 * It saves the data as JSON files in a timestamped directory.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Tables to backup
const TABLES = [
  'peptides',
  'inventory_peptides',
  'inventory_bac_water',
  'inventory_syringes',
  'inventory_other_items'
];

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create timestamped directory for this backup
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Back up each table
    for (const table of TABLES) {
      console.log(`Backing up ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');
        
      if (error) {
        console.error(`Error fetching ${table}:`, error);
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(`No data in ${table}, creating empty file`);
        fs.writeFileSync(
          path.join(backupPath, `${table}.json`),
          JSON.stringify([])
        );
        continue;
      }
      
      // Write table data to file
      fs.writeFileSync(
        path.join(backupPath, `${table}.json`),
        JSON.stringify(data, null, 2)
      );
      
      console.log(`Successfully backed up ${table} (${data.length} records)`);
    }
    
    // Create metadata file with backup info
    const metadata = {
      timestamp,
      tables: TABLES,
      recordCounts: {},
    };
    
    // Add record counts to metadata
    for (const table of TABLES) {
      const filePath = path.join(backupPath, `${table}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        metadata.recordCounts[table] = data.length;
      } else {
        metadata.recordCounts[table] = 0;
      }
    }
    
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Create or update latest.txt to track most recent backup
    fs.writeFileSync(
      path.join(backupDir, 'latest.txt'),
      backupPath
    );
    
    console.log(`Backup completed at: ${backupPath}`);
    return { success: true, path: backupPath };
    
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error };
  }
}

// Execute backup when run directly
if (require.main === module) {
  backupDatabase()
    .then(result => {
      if (result.success) {
        console.log('Backup completed successfully');
        process.exit(0);
      } else {
        console.error('Backup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error during backup:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = { backupDatabase };
}