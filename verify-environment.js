// Script to check which database environment is being used
// Run this script with: node verify-environment.js
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

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

// Function to check if a URL belongs to a specific database
function identifyDatabase(url) {
  if (url.includes(PROD_DB.url)) {
    return PROD_DB.label;
  } else if (url.includes(DEV_DB.url)) {
    return DEV_DB.label;
  } else {
    return 'UNKNOWN';
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function checkEnvironments() {
  console.log('🔍 PeptidePal Environment Checker');
  console.log('================================');
  
  // Production database check
  console.log('\n📊 Checking PRODUCTION database:');
  const prodClient = createClient(PROD_DB.url, PROD_DB.key);
  
  try {
    const { data: prodData, error: prodError } = await prodClient
      .from('peptides')
      .select('name')
      .limit(5);
    
    if (prodError) {
      console.log(`❌ Error connecting to PRODUCTION: ${prodError.message}`);
    } else {
      console.log(`✅ Connected to PRODUCTION database`);
      if (prodData && prodData.length > 0) {
        console.log(`📋 Sample data (first ${prodData.length} peptides):`);
        prodData.forEach(peptide => console.log(`  - ${peptide.name}`));
      } else {
        console.log(`⚠️ No peptides found in PRODUCTION`);
      }
    }
  } catch (error) {
    console.log(`❌ Error connecting to PRODUCTION: ${error.message}`);
  }
  
  // Development database check
  console.log('\n📊 Checking DEVELOPMENT database:');
  const devClient = createClient(DEV_DB.url, DEV_DB.key);
  
  try {
    const { data: devData, error: devError } = await devClient
      .from('peptides')
      .select('name')
      .limit(5);
    
    if (devError) {
      console.log(`❌ Error connecting to DEVELOPMENT: ${devError.message}`);
    } else {
      console.log(`✅ Connected to DEVELOPMENT database`);
      if (devData && devData.length > 0) {
        console.log(`📋 Sample data (first ${devData.length} peptides):`);
        devData.forEach(peptide => console.log(`  - ${peptide.name}`));
      } else {
        console.log(`⚠️ No peptides found in DEVELOPMENT`);
      }
    }
  } catch (error) {
    console.log(`❌ Error connecting to DEVELOPMENT: ${error.message}`);
  }
  
  console.log('\n📱 Mobile App Environment:');
  console.log('To switch databases in the app:');
  console.log('1. Go to Settings');
  console.log('2. Scroll to Developer Settings at bottom');
  console.log('3. Use the switch to toggle between DEVELOPMENT and PRODUCTION');
  console.log('4. Restart the app to ensure all components use the new environment');
  
  // Clean up
  rl.close();
}

// Run the verification
checkEnvironments().catch(error => {
  console.error('Unexpected error:', error);
  rl.close();
});