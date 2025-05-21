// Configuration file for the app
// Handles environment variables and provides defaults
import { createClient } from '@supabase/supabase-js';

// Get environment values or use defaults
// We check for environment variables from .env, but provide defaults for safety
const ENV = process.env.ENV || 'development';

// Database connections
interface DatabaseConfig {
  url: string;
  key: string;
  label: string;
}

// Define production database (the real database)
const PRODUCTION_DB: DatabaseConfig = {
  url: 'https://yawjzpovpfccgisrrfjo.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o',
  label: 'PRODUCTION'
};

// Define development database (for testing)
// ====================================================================
// Development database configuration
// ====================================================================
const DEV_DB: DatabaseConfig = {
  url: 'https://looltsvagvvjnspayhym.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvb2x0c3ZhZ3Z2am5zcGF5aHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3ODY3MTksImV4cCI6MjA2MzM2MjcxOX0.kIb0cavukeYK1wAveHXEusHur9j2JGPpW2DITDcWADw',
  label: 'DEVELOPMENT'
};

// Get the current database configuration based on environment
// Default to development for easier testing
let currentDb = DEV_DB;

// Start in development mode by default
let useDevDb = true;

/**
 * Switch to development database
 */
export function switchToDevelopmentDb() {
  useDevDb = true;
  currentDb = DEV_DB;
  console.log(`Switched to ${currentDb.label} database`);
  // Update the config object
  config.isDevelopment = true;
  config.isProduction = false;
  config.supabase = {
    url: currentDb.url,
    key: currentDb.key,
    label: currentDb.label
  };
}

/**
 * Switch to production database
 */
export function switchToProductionDb() {
  useDevDb = false;
  currentDb = PRODUCTION_DB;
  console.log(`Switched to ${currentDb.label} database`);
  // Update the config object
  config.isDevelopment = false; 
  config.isProduction = true;
  config.supabase = {
    url: currentDb.url,
    key: currentDb.key,
    label: currentDb.label
  };
}

/**
 * Safely sync all tables from production to development
 * @returns Promise with the sync result
 */
export async function syncFromProductionToDevelopment(): Promise<{success: boolean, message: string}> {
  // Safety check to prevent trying to sync within the same environment
  if (config.isProduction) {
    return {
      success: false,
      message: "Cannot sync while in PRODUCTION mode. Switch to DEVELOPMENT mode first."
    };
  }
  
  // Check if development database is properly configured
  if (DEV_DB.url.includes('your-dev') || DEV_DB.key.includes('your-dev')) {
    return {
      success: false,
      message: "Development database not configured. Please update DEV_DB in src/config.ts with your Supabase credentials. See DEV_DATABASE_SETUP.md for instructions."
    };
  }
  
  try {
    console.log("Starting sync from PRODUCTION to DEVELOPMENT...");
    
    // List of tables to sync
    const TABLES = [
      'peptides',
      'inventory_peptides',
      'inventory_bac_water',
      'inventory_syringes',
      'inventory_other_items',
      'health_metric_logs'
    ];
    
    // Tables that should have [TEST] prefix on name
    const TEST_PREFIX_TABLES = [
      'peptides', 
      'inventory_peptides', 
      'inventory_other_items'
    ];
    
    // Create clients
    const prodClient = createClient(PRODUCTION_DB.url, PRODUCTION_DB.key);
    const devClient = createClient(DEV_DB.url, DEV_DB.key);
    
    // Process each table
    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let tableResults = [];
    
    for (const tableName of TABLES) {
      console.log(`Processing table: ${tableName}`);
      
      try {
        // 1. Fetch data from production
        console.log(`Fetching data from production...`);
        const { data: prodData, error: fetchError } = await prodClient
          .from(tableName)
          .select('*');
        
        if (fetchError) {
          console.error(`Error fetching ${tableName} data:`, fetchError.message);
          tableResults.push(`${tableName}: Error: ${fetchError.message}`);
          continue;
        }
        
        if (!prodData || prodData.length === 0) {
          console.log(`No data in ${tableName} table`);
          tableResults.push(`${tableName}: No data`);
          continue;
        }
        
        console.log(`Found ${prodData.length} rows in ${tableName}`);
        
        // 2. Transform data for development
        const needsTestPrefix = TEST_PREFIX_TABLES.includes(tableName);
        
        const devData = prodData.map(item => {
          // Create a new object with lowercase keys
          const processedItem = {};
          
          // Add properties with lowercase keys
          Object.entries(item).forEach(([key, value]) => {
            // Convert camelCase to lowercase for column names
            const lowerKey = key.toLowerCase();
            processedItem[lowerKey] = value;
          });
          
          // Special handling for peptides table to maintain original camelCase
          // Based on table definition inspection, the database uses camelCase column names
          if (tableName === 'peptides') {
            // Maintain original camelCase column names
            if ('dataAiHint' in item) {
              processedItem['dataAiHint'] = item.dataAiHint;
            }
            if ('dosageUnit' in item) {
              processedItem['dosageUnit'] = item.dosageUnit;
            }
            if ('typicalDosageUnits' in item) {
              processedItem['typicalDosageUnits'] = item.typicalDosageUnits;
            }
            if ('doseLogs' in item) {
              processedItem['doseLogs'] = item.doseLogs;
            }
            if ('imageUrl' in item) {
              processedItem['imageUrl'] = item.imageUrl;
            }
            if ('startDate' in item) {
              processedItem['startDate'] = item.startDate;
            }
          }
          
          // Add [TEST] prefix to name if needed
          if (needsTestPrefix && item.name) {
            processedItem.name = item.name.startsWith('[TEST]') 
              ? item.name 
              : `[TEST] ${item.name}`;
          }
          
          return processedItem;
        });
        
        // 3. Delete existing test data
        if (needsTestPrefix) {
          for (const item of devData) {
            try {
              await devClient
                .from(tableName)
                .delete()
                .eq('name', item.name);
              
            } catch (deleteError) {
              // Continue anyway
            }
          }
        }
        
        // 4. Insert data into development
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        
        for (const item of devData) {
          try {
            // First try to delete existing record with same id to avoid constraint violation
            await devClient
              .from(tableName)
              .delete()
              .eq('id', item.id)
              .then(({error}) => {
                // Ignore errors during deletion
              });
            
            // Then insert the item
            const { error: insertError } = await devClient
              .from(tableName)
              .insert(item);
            
            if (insertError) {
              console.error(`Error inserting row in ${tableName}:`, insertError.message);
              
              // Check if it's a duplicate key error
              if (insertError.message && insertError.message.includes('duplicate key')) {
                console.log(`Item already exists in ${tableName}, skipping...`);
                skippedCount++;
              } else {
                failCount++;
              }
            } else {
              successCount++;
            }
            
          } catch (error) {
            console.error(`Error processing row in ${tableName}:`, error.message);
            failCount++;
          }
        }
        
        // Report skipped items
        if (skippedCount > 0) {
          tableResults.push(`${tableName}: ${successCount} inserted, ${skippedCount} skipped, ${failCount} failed`);
        } else {
          tableResults.push(`${tableName}: ${successCount} inserted, ${failCount} failed`);
        }
        
        // Update totals
        totalSuccessCount += successCount;
        totalFailCount += failCount;
        
      } catch (error) {
        console.error(`Error processing ${tableName}:`, error.message);
        tableResults.push(`${tableName}: Error: ${error.message}`);
      }
    }
    
    // Generate result message
    const resultMessage = `Sync results:\n${tableResults.join('\n')}\n\nTotal: ${totalSuccessCount} successful, ${totalFailCount} failed`;
    
    if (totalFailCount > 0 && totalSuccessCount === 0) {
      return {
        success: false,
        message: `Failed to sync any data. ${resultMessage}`
      };
    }
    
    return {
      success: true,
      message: resultMessage
    };
    
  } catch (error) {
    console.error("Error during sync:", error);
    return {
      success: false,
      message: `Sync failed: ${error.message || "Unknown error"}`
    };
  }
}

// Export the config
export const config = {
  env: ENV,
  isDevelopment: ENV === 'development' || useDevDb,
  isProduction: ENV === 'production' && !useDevDb,
  
  supabase: {
    url: currentDb.url,
    key: currentDb.key,
    label: currentDb.label
  },
  
  // Add other configuration properties here as needed
  version: '1.0.0',
  appName: 'PeptidePal',
  
  // Environment detection helper - for debugging
  getEnvironmentInfo: () => {
    return {
      env: ENV,
      useDevDb: useDevDb,
      isDevelopment: ENV === 'development' || useDevDb,
      isProduction: ENV === 'production' && !useDevDb,
      dbUrl: currentDb.url,
      dbLabel: currentDb.label
    };
  }
};

// Log config without sensitive information
console.log(`App config loaded: Environment: ${config.env}, Database: ${config.supabase.label}`);