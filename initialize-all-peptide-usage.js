// Script to initialize usage tracking for all peptides in the inventory
const { createClient } = require('@supabase/supabase-js');

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

// Get all peptides from both tables and update usage tracking
async function initializeAllPeptideUsage() {
  try {
    console.log('Initializing usage tracking for all peptides...');
    
    // Get all peptides from inventory
    const { data: inventoryPeptides, error: invError } = await supabase
      .from('inventory_peptides')
      .select('*');
      
    if (invError) throw invError;
    console.log(`Found ${inventoryPeptides.length} peptides in inventory`);
    
    // Get all peptides with vials info
    const { data: peptides, error: pepError } = await supabase
      .from('peptides')
      .select('*');
      
    if (pepError) throw pepError;
    console.log(`Found ${peptides.length} peptides in peptides table`);
    
    // Process each peptide
    for (const inventoryPeptide of inventoryPeptides) {
      // Find matching peptide in peptides table
      const peptide = peptides.find(p => p.id === inventoryPeptide.id);
      
      if (!peptide) {
        console.log(`No matching peptide found for inventory peptide ${inventoryPeptide.id} (${inventoryPeptide.name})`);
        continue;
      }
      
      // Find active vial
      const activeVial = peptide.vials?.find(v => v.isActive);
      if (!activeVial) {
        console.log(`No active vial found for peptide ${peptide.id} (${peptide.name})`);
        
        // Initialize with 0 doses used
        if (inventoryPeptide.active_vial_status === 'IN_USE') {
          console.log(`Setting usage tracking to 0 for peptide ${peptide.name} with active status but no active vial`);
          await updatePeptideUsage(peptide.id, 0);
        }
        continue;
      }
      
      // Calculate used doses
      const usedDoses = Math.floor(activeVial.initialAmountUnits - activeVial.remainingAmountUnits);
      console.log(`Peptide ${peptide.name}: ${usedDoses} doses used (${activeVial.remainingAmountUnits}/${activeVial.initialAmountUnits} remaining)`);
      
      // Update inventory peptide with usage tracking
      await updatePeptideUsage(peptide.id, usedDoses);
    }
    
    console.log('Usage tracking initialization complete!');
  } catch (error) {
    console.error('Error initializing peptide usage tracking:', error);
  }
}

// Update inventory peptide with usage tracking information
async function updatePeptideUsage(peptideId, usedDoses) {
  try {
    console.log(`Updating usage tracking for peptide ${peptideId}: ${usedDoses} doses used`);
    
    // Update the batch_number field with usage information
    const { error } = await supabase
      .from('inventory_peptides')
      .update({ batch_number: `USAGE:${usedDoses}` })
      .eq('id', peptideId);
    
    if (error) throw error;
    console.log(`Successfully updated usage tracking for peptide ${peptideId}`);
    return true;
  } catch (error) {
    console.error(`Error updating peptide ${peptideId} usage tracking:`, error);
    return false;
  }
}

// Run the script
initializeAllPeptideUsage();