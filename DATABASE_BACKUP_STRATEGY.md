# PeptidePal Database Backup Strategy

## Overview

This document outlines the backup strategy for PeptidePal's Supabase database to ensure data safety and recovery options in case of data corruption, accidental changes, or schema issues.

## 1. Supabase Built-in Backups

Supabase provides built-in backup solutions that should be your primary protection.

### Point-in-Time Recovery (PITR)

Supabase Pro and Team plans include Point-in-Time Recovery, which allows you to restore your database to any point within the retention period (typically 7 days).

**Steps to enable PITR:**

1. Log in to your Supabase dashboard
2. Go to Project Settings > Database
3. Under "Backups & PITR", enable Point-in-Time Recovery
4. Set the retention period to the maximum available (usually 7 days)

**Restoring from PITR:**

1. In the Supabase dashboard, go to Project Settings > Database
2. Under "Backups & PITR", click "Restore"
3. Select the exact time you want to restore to
4. Confirm the restoration

Note: This will restore the entire database to that point in time.

### Daily Backups

Supabase automatically creates daily backups of your database. These are full snapshots of your database that are kept for a defined retention period.

**Accessing Daily Backups:**

1. In the Supabase dashboard, go to Project Settings > Database
2. Under "Backups", you'll see a list of available backups
3. Click "Download" to download a backup or "Restore" to restore from it

## 2. Custom Backup Scripts

In addition to Supabase's built-in backups, we implement our own custom backup solution for more granular control and immediate recovery options.

### Scheduled Programmatic Backups

The following Node.js script will perform regular backups of critical tables and save them as JSON files.

```javascript
// Create file: /scripts/backup-database.js

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
  'inventory_other_items',
  'health_metric_logs'
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
    
    // Create latest.txt to track most recent backup
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
```

### Restoration Script

Create a script to restore data from backups:

```javascript
// Create file: /scripts/restore-from-backup.js

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
async function restoreFromBackup(backupName) {
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
  
  console.log(`Found ${backupFiles.length} tables to restore: ${backupFiles.join(', ')}`);
  
  // Confirm restore
  const answer = await new Promise(resolve => {
    rl.question(`Are you sure you want to restore these tables? This will OVERWRITE existing data! (yes/no): `, resolve);
  });
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('Restore cancelled.');
    return { success: false, cancelled: true };
  }
  
  // Proceed with restore
  const results = { success: true, tableResults: {} };
  
  for (const table of backupFiles) {
    console.log(`Restoring ${table}...`);
    
    try {
      // Read backup data
      const backupFilePath = path.join(backupPath, `${table}.json`);
      const tableData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
      
      if (!tableData || tableData.length === 0) {
        console.log(`No data for ${table}, skipping.`);
        results.tableResults[table] = { success: true, message: 'No data to restore' };
        continue;
      }
      
      // For each item in the table
      let successCount = 0;
      let errorCount = 0;
      
      // First clear the existing data
      const { error: clearError } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null); // Safe delete - only delete rows with an ID
        
      if (clearError) {
        console.error(`Error clearing existing data from ${table}:`, clearError);
        results.tableResults[table] = { success: false, error: clearError };
        continue;
      }
      
      // Insert the backup data in chunks to avoid request size limits
      const CHUNK_SIZE = 50;
      for (let i = 0; i < tableData.length; i += CHUNK_SIZE) {
        const chunk = tableData.slice(i, i + CHUNK_SIZE);
        
        const { error: insertError } = await supabase
          .from(table)
          .insert(chunk);
          
        if (insertError) {
          console.error(`Error inserting data chunk into ${table}:`, insertError);
          errorCount += chunk.length;
        } else {
          successCount += chunk.length;
          console.log(`Restored ${successCount}/${tableData.length} records to ${table}`);
        }
      }
      
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
  
  console.log('Restore operation completed!');
  return results;
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
      rl.question('Enter the number of the backup to restore (or "q" to quit): ', resolve);
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
    const result = await restoreFromBackup(selectedBackup);
    
    if (result.success) {
      console.log('Restore completed successfully!');
    } else if (result.cancelled) {
      console.log('Restore was cancelled by user.');
    } else {
      console.log('Restore completed with errors.');
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
```

### Automated Backup Schedule (cron or GitHub Actions)

Create a script to set up a cron job to run backups daily:

```javascript
// Create file: /scripts/setup-cron-backup.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get absolute path to backup script
const backupScriptPath = path.resolve(__dirname, './backup-database.js');

// Create shell script wrapper
const wrapperScriptPath = path.resolve(__dirname, './run-backup.sh');
const wrapperScript = `#!/bin/bash
cd "${path.dirname(backupScriptPath)}"
node "${backupScriptPath}" >> "${path.resolve(__dirname, '../backups/backup.log')}" 2>&1
`;

// Write wrapper script
fs.writeFileSync(wrapperScriptPath, wrapperScript);
fs.chmodSync(wrapperScriptPath, '755'); // Make executable

console.log('Created wrapper script at', wrapperScriptPath);

// Set up cron job (runs daily at 3:00 AM)
const cronCommand = `(crontab -l 2>/dev/null; echo "0 3 * * * ${wrapperScriptPath}") | crontab -`;

exec(cronCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error setting up cron job:', error);
    return;
  }
  
  if (stderr) {
    console.error('Error output:', stderr);
    return;
  }
  
  console.log('Cron job set up successfully!');
  console.log('Backups will run daily at 3:00 AM');
});
```

## 3. Backup Retention Policy

Implement a backup rotation and cleanup policy to manage disk space:

```javascript
// Create file: /scripts/cleanup-old-backups.js

const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const DAYS_TO_KEEP_DAILY = 7;  // Keep daily backups for 7 days
const WEEKS_TO_KEEP_WEEKLY = 4;  // Keep weekly backups for 4 weeks
const MONTHS_TO_KEEP_MONTHLY = 12;  // Keep monthly backups for 12 months

function cleanupOldBackups() {
  console.log('Starting backup cleanup...');
  
  // Get all backup directories
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups directory found. Nothing to clean up.');
    return;
  }
  
  const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
    .map(dirent => {
      const name = dirent.name;
      const timestamp = name.replace('backup-', '');
      const date = new Date(timestamp.replace(/-/g, ':'));
      return { name, date, path: path.join(BACKUP_DIR, name) };
    })
    .sort((a, b) => b.date - a.date); // Most recent first
    
  if (backups.length === 0) {
    console.log('No backups found to clean up.');
    return;
  }
  
  console.log(`Found ${backups.length} backups.`);
  
  // Keep track of what we're keeping
  const keepDaily = [];
  const keepWeekly = [];
  const keepMonthly = [];
  const toDelete = [];
  
  const now = new Date();
  let lastDayKept = null;
  let lastWeekKept = null;
  let lastMonthKept = null;
  
  // Process each backup
  backups.forEach(backup => {
    const day = backup.date.toISOString().substring(0, 10); // YYYY-MM-DD
    const week = `${backup.date.getFullYear()}-W${Math.floor(backup.date.getDate() / 7) + 1}`;
    const month = backup.date.toISOString().substring(0, 7); // YYYY-MM
    
    // Determine if we should keep this backup
    const daysSinceBackup = Math.floor((now - backup.date) / (1000 * 60 * 60 * 24));
    const weeksSinceBackup = Math.floor(daysSinceBackup / 7);
    const monthsSinceBackup = (now.getFullYear() - backup.date.getFullYear()) * 12 + 
                             (now.getMonth() - backup.date.getMonth());
    
    let keep = false;
    let reason = '';
    
    // Keep recent daily backups
    if (daysSinceBackup <= DAYS_TO_KEEP_DAILY && day !== lastDayKept) {
      keepDaily.push(backup);
      lastDayKept = day;
      keep = true;
      reason = 'daily';
    }
    // Keep weekly backups
    else if (weeksSinceBackup <= WEEKS_TO_KEEP_WEEKLY && week !== lastWeekKept) {
      keepWeekly.push(backup);
      lastWeekKept = week;
      keep = true;
      reason = 'weekly';
    }
    // Keep monthly backups
    else if (monthsSinceBackup <= MONTHS_TO_KEEP_MONTHLY && month !== lastMonthKept) {
      keepMonthly.push(backup);
      lastMonthKept = month;
      keep = true;
      reason = 'monthly';
    }
    
    if (keep) {
      console.log(`Keeping ${backup.name} (${reason} retention)`);
    } else {
      toDelete.push(backup);
    }
  });
  
  // Delete backups that aren't being kept
  console.log(`\nDeleting ${toDelete.length} old backups...`);
  
  toDelete.forEach(backup => {
    try {
      // Recursively delete the backup directory
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`Deleted ${backup.name}`);
    } catch (error) {
      console.error(`Error deleting ${backup.name}:`, error);
    }
  });
  
  console.log(`\nBackup cleanup complete.`);
  console.log(`Kept ${keepDaily.length} daily, ${keepWeekly.length} weekly, and ${keepMonthly.length} monthly backups.`);
  console.log(`Deleted ${toDelete.length} old backups.`);
}

// Execute cleanup when run directly
if (require.main === module) {
  cleanupOldBackups();
} else {
  module.exports = { cleanupOldBackups };
}
```

## 4. Implementation Schedule

1. **Immediate**:
   - Set up Supabase PITR if available on your plan
   - Run manual backups weekly using the backup script

2. **Short-term (next 2 weeks)**:
   - Configure scheduled backups using cron or GitHub Actions
   - Implement the backup retention policy
   - Test the restoration process

3. **Medium-term (1-2 months)**:
   - Set up monitoring for backup jobs
   - Create alerts for backup failures
   - Document backup and restore procedures for the team

## 5. Database Best Practices

In addition to regular backups, follow these practices to minimize the need for restores:

1. **Schema Validation**:
   - Add runtime checks to verify column names before updates
   - Validate data shapes before writing to the database

2. **Change Management**:
   - Test schema changes in development first
   - Document all database changes in a changelog
   - Use the multi-step update approach for complex changes

3. **Monitoring and Alerting**:
   - Set up error tracking for database operations
   - Monitor unsuccessful database operations
   - Create alerts for unexpected data loss or corruption

## 6. Emergency Recovery Procedure

If data corruption or loss occurs:

1. **Stop all app operations** to prevent further issues
2. **Assess the damage** - identify affected tables and data
3. **Check recent backups** - use the `listBackups()` function to find a suitable backup
4. **Perform a test restore** in a development environment if possible
5. **Restore the affected data** using the `restoreFromBackup()` function
6. **Verify data integrity** after restoration
7. **Resume app operations** once data is confirmed to be correct
8. **Document the incident** and improve backup procedures if needed

Remember: Regular testing of the backup and restore process is essential to ensure it works when needed.