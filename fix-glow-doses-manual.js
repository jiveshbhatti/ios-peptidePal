// Script to manually set Glow peptide's correct dose count
const { createClient } = require('@supabase/supabase-js');

async function fixGlowDosesManual() {
  // Production database credentials
  const supabase = createClient(
    'https://yawjzpovpfccgisrrfjo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o'
  );

  console.log('Connecting to production database...');

  try {
    // 1. Fetch Glow peptide
    console.log('Fetching Glow peptide data...');
    const { data: peptide, error } = await supabase
      .from('peptides')
      .select('*')
      .eq('name', 'Glow')
      .single();

    if (error) {
      console.error('Error fetching Glow peptide:', error);
      return;
    }

    if (!peptide) {
      console.error('Glow peptide not found');
      return;
    }

    console.log('Current Glow peptide data:', JSON.stringify(peptide, null, 2));

    // 2. Get current vial information
    const vials = peptide.vials || [];
    const activeVialIndex = vials.findIndex(v => v.isActive);
    
    if (activeVialIndex === -1) {
      console.error('No active vial found for Glow');
      return;
    }

    const activeVial = vials[activeVialIndex];
    console.log('Current active vial data:', JSON.stringify(activeVial, null, 2));
    
    // 3. Manually set vial remaining amount based on known information
    const initialAmount = activeVial.initialAmountUnits || 29; // Keep original initial amount
    const correctUsedDoses = 14; // Based on user confirmation that 14 doses were taken
    const correctRemainingAmount = Math.max(0, initialAmount - correctUsedDoses);
    
    console.log(`Initial amount: ${initialAmount}`);
    console.log(`Manually setting used doses to: ${correctUsedDoses}`);
    console.log(`Correct remaining amount should be: ${correctRemainingAmount}`);
    console.log(`Current remaining amount is: ${activeVial.remainingAmountUnits}`);

    // 4. Update the vial with manually corrected remaining amount
    console.log('Updating vial with manually corrected remaining amount...');
    
    // Create updated vials array with corrected remaining amount
    const updatedVials = [...vials];
    updatedVials[activeVialIndex] = {
      ...activeVial,
      remainingAmountUnits: correctRemainingAmount
    };
    
    // Update the peptide with correct vial data - use camelCase property name with quotes
    const { error: updateError } = await supabase
      .from('peptides')
      .update({ "vials": updatedVials })
      .eq('id', peptide.id);
      
    if (updateError) {
      console.error('Error updating vial data:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated Glow vial remaining amount');

    // 5. Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('peptides')
      .select('*')
      .eq('id', peptide.id)
      .single();
      
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    const verifyVial = verifyData.vials.find(v => v.isActive);
    console.log(`Updated vial remaining amount: ${verifyVial.remainingAmountUnits}`);
    console.log(`Showing as: ${verifyVial.remainingAmountUnits}/${verifyVial.initialAmountUnits}`);
    console.log(`This should now show that 14 doses have been taken and ${verifyVial.remainingAmountUnits} doses remain.`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the fix
fixGlowDosesManual();