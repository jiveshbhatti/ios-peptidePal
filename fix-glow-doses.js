// Script to repair Glow peptide dose count in production
const { createClient } = require('@supabase/supabase-js');

async function fixGlowDoses() {
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

    // 2. Count dose logs and fix vial remaining amount
    const doseLogs = peptide.doseLogs || [];
    console.log(`Found ${doseLogs.length} dose logs`);

    // Find active vial
    const vials = peptide.vials || [];
    const activeVialIndex = vials.findIndex(v => v.isActive);
    
    if (activeVialIndex === -1) {
      console.error('No active vial found for Glow');
      return;
    }

    const activeVial = vials[activeVialIndex];
    console.log('Current active vial data:', JSON.stringify(activeVial, null, 2));
    
    // Calculate correct remaining doses based on initial amount and used doses
    const initialAmount = activeVial.initialAmountUnits || 33;
    const usedDoses = doseLogs.filter(log => log.vialId === activeVial.id).length;
    const correctRemainingAmount = initialAmount - usedDoses;
    
    console.log(`Initial amount: ${initialAmount}`);
    console.log(`Used doses: ${usedDoses}`);
    console.log(`Correct remaining amount should be: ${correctRemainingAmount}`);
    console.log(`Current remaining amount is: ${activeVial.remainingAmountUnits}`);

    // 3. Update the vial with correct remaining amount
    if (correctRemainingAmount !== activeVial.remainingAmountUnits) {
      console.log('Updating vial with correct remaining amount...');
      
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
    } else {
      console.log('✅ Vial remaining amount is already correct');
    }

    // 4. Verify the update
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
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the fix
fixGlowDoses();