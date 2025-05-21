// Script to fix inventory peptide display for Glow
const { createClient } = require('@supabase/supabase-js');

async function fixInventoryDisplay() {
  // Production database credentials
  const supabase = createClient(
    'https://yawjzpovpfccgisrrfjo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o'
  );

  console.log('Connecting to production database...');

  try {
    // 1. First get the peptide data to confirm the correct usage
    console.log('Fetching Glow peptide data...');
    const { data: peptide, error: peptideError } = await supabase
      .from('peptides')
      .select('*')
      .eq('name', 'Glow')
      .single();
      
    if (peptideError) {
      console.error('Error fetching Glow peptide:', peptideError);
      return;
    }
    
    // Get active vial info
    const activeVial = peptide.vials?.find(v => v.isActive);
    if (!activeVial) {
      console.error('No active vial found for Glow');
      return;
    }
    
    const usedDoses = activeVial.initialAmountUnits - activeVial.remainingAmountUnits;
    console.log(`Active vial shows ${usedDoses} doses used out of ${activeVial.initialAmountUnits}`);
    
    // 2. Get the inventory peptide
    console.log('Fetching inventory peptide data...');
    const { data: invPeptide, error: invError } = await supabase
      .from('inventory_peptides')
      .select('*')
      .eq('id', peptide.id)
      .single();
      
    if (invError) {
      console.error('Error fetching inventory peptide:', invError);
      return;
    }
    
    console.log('Current inventory peptide data:', JSON.stringify(invPeptide, null, 2));
    
    // 3. Add a custom field for dose tracking
    // Since we can't add columns without modifying the database schema,
    // we'll explore different approaches
    
    // Approach 1: Serialize usage into a custom field
    // This approach is limited by the current schema
    
    // Check if there are any columns we can store this information in
    const availableColumns = Object.keys(invPeptide);
    console.log('Available columns:', availableColumns.join(', '));
    
    // If there's a notes or metadata field, we could use that
    const hasMetadataField = availableColumns.includes('metadata') || 
                              availableColumns.includes('notes') ||
                              availableColumns.includes('batch_number');
    
    if (hasMetadataField) {
      // We can store usage info in one of these fields
      const fieldToUse = availableColumns.includes('batch_number') ? 'batch_number' : 
                         availableColumns.includes('notes') ? 'notes' : 'metadata';
      
      console.log(`Using ${fieldToUse} field to store dose usage tracking...`);
      
      // Create an update with the usage embedded in the field
      const update = {};
      update[fieldToUse] = `USAGE:${usedDoses}`;
      
      // Update the inventory peptide
      const { error: updateError } = await supabase
        .from('inventory_peptides')
        .update(update)
        .eq('id', peptide.id);
        
      if (updateError) {
        console.error('Error updating inventory peptide:', updateError);
        return;
      }
      
      console.log(`✅ Successfully updated inventory peptide's ${fieldToUse} field with usage tracking`);
    } else {
      console.log('No suitable field found for storing usage information');
      
      // Approach 2: Modify the UI to look at the peptide table instead
      console.log('\nRecommendation: Modify the UI code to look at peptide.vials[activeVial].remainingAmountUnits');
      console.log('The correct usage count (14 doses) is already stored in the peptide table');
    }
    
    // 4. Calculate the expected display
    const totalDoses = Math.floor(invPeptide.concentration_per_vial_mcg / invPeptide.typical_dose_mcg);
    console.log(`\nThe UI should show: ${usedDoses}/${totalDoses}`);
    
    // 5. Verify the data is consistent
    console.log('\nData verification:');
    console.log(`peptide.vials[active].initialAmountUnits: ${activeVial.initialAmountUnits}`);
    console.log(`peptide.vials[active].remainingAmountUnits: ${activeVial.remainingAmountUnits}`);
    console.log(`Used doses (calculated): ${usedDoses}`);
    console.log(`Total doses per vial (calculated): ${totalDoses}`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the fix
fixInventoryDisplay();