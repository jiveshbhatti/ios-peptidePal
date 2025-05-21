// Script to check the UI display for doses used
const { createClient } = require('@supabase/supabase-js');

async function checkUsageDisplay() {
  // Production database credentials
  const supabase = createClient(
    'https://yawjzpovpfccgisrrfjo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o'
  );

  console.log('Connecting to production database...');

  try {
    // 1. Check peptides table
    const { data: peptide, error: peptideError } = await supabase
      .from('peptides')
      .select('*')
      .eq('name', 'Glow')
      .single();
      
    if (peptideError) {
      console.error('Error fetching Glow peptide:', peptideError);
      return;
    }
    
    // 2. Check inventory_peptides table
    const { data: invPeptide, error: invError } = await supabase
      .from('inventory_peptides')
      .select('*')
      .eq('id', peptide.id)
      .single();
      
    if (invError) {
      console.error('Error fetching inventory peptide:', invError);
      return;
    }
    
    // 3. Analyze the UI display based on data
    console.log('\n=== USAGE DISPLAY ANALYSIS ===');
    
    // Get active vial from peptide
    const activeVial = peptide.vials?.find(v => v.isActive);
    
    console.log('\nACTIVE VIAL DATA:');
    if (activeVial) {
      console.log(`ID: ${activeVial.id}`);
      console.log(`Initial amount: ${activeVial.initialAmountUnits} units`);
      console.log(`Remaining amount: ${activeVial.remainingAmountUnits} units`);
      console.log(`Units used: ${activeVial.initialAmountUnits - activeVial.remainingAmountUnits} units`);
      
      // Expected progress bar calculation
      console.log(`\nEXPECTED PROGRESS BAR: ${activeVial.initialAmountUnits - activeVial.remainingAmountUnits}/${activeVial.initialAmountUnits}`);
    } else {
      console.log('No active vial found');
    }
    
    // Calculate how this would be displayed in the UI
    console.log('\nINVENTORY DISPLAY DATA:');
    console.log(`Name: ${invPeptide.name}`);
    console.log(`Total vials: ${invPeptide.num_vials}`);
    console.log(`Active vial status: ${invPeptide.active_vial_status}`);
    
    // Check what powers the "/33" number
    console.log('\nRENDERING EXPLORATION:');
    
    const typicalDoseUnits = invPeptide.typical_dose_mcg || 300;
    const totalDoseUnits = invPeptide.concentration_per_vial_mcg || 10000;
    const totalDoses = Math.floor(totalDoseUnits / typicalDoseUnits);
    
    console.log(`Typical dose: ${typicalDoseUnits}mcg`);
    console.log(`Total mcg per vial: ${totalDoseUnits}mcg`);
    console.log(`Calculated total doses per vial: ${totalDoses}`);
    
    // Find any progress indicators in the database
    console.log('\nCHECKING FOR PROGRESS INDICATORS:');
    
    // Peptide might have usage stats
    if (activeVial) {
      const usedDoses = activeVial.initialAmountUnits - activeVial.remainingAmountUnits;
      console.log(`From active vial - used doses: ${usedDoses}`);
      console.log(`Progress would be: ${usedDoses}/${activeVial.initialAmountUnits}`);
    }
    
    // Calculate based on dose logs
    const doseLogs = peptide.doseLogs || [];
    console.log(`\nDose logs in peptide: ${doseLogs.length}`);
    if (doseLogs.length > 0) {
      // Count by vial
      const logsPerVial = {};
      doseLogs.forEach(log => {
        if (!logsPerVial[log.vialId]) {
          logsPerVial[log.vialId] = 0;
        }
        logsPerVial[log.vialId]++;
      });
      
      console.log('Logs per vial:');
      Object.entries(logsPerVial).forEach(([vialId, count]) => {
        const isActive = activeVial && activeVial.id === vialId;
        console.log(`  Vial ${vialId.substring(0, 8)}... (${isActive ? 'ACTIVE' : 'inactive'}): ${count} logs`);
      });
    }
    
    // Check for any inventory usage tracking
    console.log('\nINVENTORY USAGE TRACKING:');
    let foundUsageTracking = false;
    for (const [key, value] of Object.entries(invPeptide)) {
      if (key.includes('use') || key.includes('dose') || key.includes('remaining') || key.includes('taken')) {
        console.log(`${key}: ${value}`);
        foundUsageTracking = true;
      }
    }
    
    if (!foundUsageTracking) {
      console.log('No direct usage tracking found in inventory_peptides');
    }
    
    // Check for custom fields
    console.log('\nLooking for any custom fields that might store usage...');
    
    // Check if there's any numeric field that could be a counter
    for (const [key, value] of Object.entries(invPeptide)) {
      if (typeof value === 'number' && key !== 'num_vials' && 
          key !== 'concentration_per_vial_mcg' && key !== 'low_stock_threshold' &&
          key !== 'bac_water_volume_added' && key !== 'typical_dose_mcg') {
        console.log(`Potential usage field: ${key} = ${value}`);
      }
    }
    
    // Look for any calculated fields or related tables
    console.log('\nPOSSIBLE SOLUTIONS:');
    console.log('1. UI might be directly calculating doses from the peptide table vial data');
    console.log('   Fix: Ensure activeVial.remainingAmountUnits is correct (currently:', activeVial?.remainingAmountUnits, ')');
    console.log('2. UI might be using a lookup to inventory_peptides with a custom field');
    console.log('   Fix: We may need to add a usage tracking field to inventory_peptides');
    console.log('3. UI might be calculating directly based on dose logs count');
    console.log('   Fix: We may need to restore missing dose logs if possible');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the check
checkUsageDisplay();