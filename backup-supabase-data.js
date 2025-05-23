#!/usr/bin/env node

/**
 * Backup all Supabase data before removing Supabase from the app
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase credentials from the app
const SUPABASE_URL = 'https://looltsvagvvjnspayhym.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function backupSupabaseData() {
  console.log('🔄 Starting Supabase data backup...\n');
  
  const timestamp = new Date().toISOString();
  const backupDir = `./backups/supabase-final-backup-${timestamp}`;
  
  try {
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });
    
    const tables = [
      'peptides',
      'inventory_peptides',
      'inventory_bac_water',
      'inventory_syringes',
      'inventory_other_items'
    ];
    
    const backup = {
      timestamp,
      supabaseUrl: SUPABASE_URL,
      tables: {}
    };
    
    // Backup each table
    for (const table of tables) {
      console.log(`📊 Backing up ${table}...`);
      
      // Handle different column names for different tables
      let query = supabase.from(table).select('*');
      
      // Only order by created_at if it exists (not for peptides table)
      if (table !== 'peptides') {
        query = query.order('created_at', { ascending: true });
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error(`❌ Error backing up ${table}:`, error);
        backup.tables[table] = { error: error.message };
      } else {
        backup.tables[table] = {
          count: data.length,
          data: data
        };
        console.log(`✅ Backed up ${data.length} records from ${table}`);
        
        // Save individual table data
        await fs.writeFile(
          path.join(backupDir, `${table}.json`),
          JSON.stringify(data, null, 2)
        );
      }
    }
    
    // Save complete backup
    await fs.writeFile(
      path.join(backupDir, 'complete-backup.json'),
      JSON.stringify(backup, null, 2)
    );
    
    // Create a summary
    const summary = {
      timestamp,
      location: backupDir,
      tables: Object.entries(backup.tables).map(([name, data]) => ({
        name,
        recordCount: data.count || 0,
        hasError: !!data.error
      }))
    };
    
    await fs.writeFile(
      path.join(backupDir, 'backup-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n📁 Backup completed successfully!');
    console.log(`📍 Location: ${backupDir}`);
    console.log('\n📊 Summary:');
    summary.tables.forEach(table => {
      console.log(`   ${table.name}: ${table.recordCount} records`);
    });
    
    // Also save to a known location for easy access
    await fs.writeFile(
      './backups/latest-supabase-backup.json',
      JSON.stringify(backup, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Run the backup
backupSupabaseData();