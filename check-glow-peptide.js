// Script to examine Glow peptide data in production
const { createClient } = require('@supabase/supabase-js');

async function checkGlowPeptide() {
  // Production database credentials
  const supabase = createClient(
    'https://yawjzpovpfccgisrrfjo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o'
  );

  console.log('Connecting to production database...');

  try {
    // Fetch Glow peptide
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

    // Extract and print important information
    console.log('\n==== GLOW PEPTIDE DATA INSPECTION ====');
    console.log(`ID: ${peptide.id}`);
    console.log(`Name: ${peptide.name}`);
    console.log(`Column names: ${Object.keys(peptide).join(', ')}`);
    
    // Check vials
    const vials = peptide.vials || [];
    console.log(`\nVials count: ${vials.length}`);
    
    vials.forEach((vial, index) => {
      console.log(`\nVial #${index + 1}:`);
      console.log(`  ID: ${vial.id}`);
      console.log(`  Active: ${vial.isActive}`);
      console.log(`  Initial amount: ${vial.initialAmountUnits}`);
      console.log(`  Remaining amount: ${vial.remainingAmountUnits}`);
      console.log(`  Reconstitution: ${vial.reconstitutionBacWaterMl}ml`);
      console.log(`  Date added: ${vial.dateAdded}`);
      console.log(`  Expiration: ${vial.expirationDate}`);
    });
    
    // Check dose logs
    const doseLogs = peptide.doseLogs || [];
    console.log(`\nDose logs count: ${doseLogs.length}`);
    
    // Count doses per vial
    const dosesPerVial = {};
    doseLogs.forEach(log => {
      if (!dosesPerVial[log.vialId]) {
        dosesPerVial[log.vialId] = 0;
      }
      dosesPerVial[log.vialId]++;
    });
    
    console.log('\nDoses per vial:');
    Object.entries(dosesPerVial).forEach(([vialId, count]) => {
      const vial = vials.find(v => v.id === vialId);
      const vialLabel = vial ? (vial.isActive ? 'ACTIVE' : 'inactive') : 'UNKNOWN';
      console.log(`  Vial ${vialId.substring(0, 8)}... (${vialLabel}): ${count} doses`);
    });
    
    // Show the last 5 dose logs
    console.log('\nLast 5 dose logs:');
    doseLogs.slice(-5).forEach((log, index) => {
      console.log(`  ${index + 1}. Date: ${log.date || log.loggedAt}, Amount: ${log.dosage || log.amount}${log.unit}, Time: ${log.timeOfDay}`);
    });
    
    // Calculate the expected remaining amount
    const activeVial = vials.find(v => v.isActive);
    if (activeVial) {
      const vialDoses = doseLogs.filter(log => log.vialId === activeVial.id).length;
      const expectedRemaining = activeVial.initialAmountUnits - vialDoses;
      
      console.log('\nActive vial calculation:');
      console.log(`  Initial amount: ${activeVial.initialAmountUnits} units`);
      console.log(`  Doses taken: ${vialDoses}`);
      console.log(`  Expected remaining: ${expectedRemaining} units`);
      console.log(`  Actual remaining: ${activeVial.remainingAmountUnits} units`);
      console.log(`  DISCREPANCY: ${activeVial.remainingAmountUnits - expectedRemaining} units`);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the inspection
checkGlowPeptide();