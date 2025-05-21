// Script to check the schema in the production database
const { createClient } = require('@supabase/supabase-js');

// Production database credentials
const PROD_DB = {
  url: 'https://yawjzpovpfccgisrrfjo.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o',
  label: 'PRODUCTION'
};

// Tables to check
const TABLES = [
  'inventory_peptides',
  'inventory_bac_water'
];

async function checkSchema() {
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  
  console.log('🔍 Checking Production Database Schema');
  console.log('====================================');
  
  for (const tableName of TABLES) {
    console.log(`\n📋 Table: ${tableName}`);
    
    try {
      // Fetch a sample row to examine schema
      const { data, error } = await prodClient
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️ No data available');
        continue;
      }
      
      // List all columns and their values
      const row = data[0];
      console.log('Columns:');
      Object.entries(row).forEach(([key, value]) => {
        console.log(`- ${key}: ${typeof value} (${value !== null ? value : 'null'})`);
      });
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

checkSchema().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
});