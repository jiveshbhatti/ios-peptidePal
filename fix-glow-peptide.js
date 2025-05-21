// Fix Glow peptide script
const { createClient } = require('@supabase/supabase-js');

// Same Supabase credentials as the main app
const SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixGlowPeptide() {
  try {
    console.log('Fetching peptides from database...');
    
    // Get all peptides
    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${peptides.length} peptides.`);
    
    // Find the Glow peptide
    const glowPeptide = peptides.find(p => p.name === 'Glow');
    
    if (!glowPeptide) {
      console.log('No "Glow" peptide found in the database.');
      return;
    }
    
    console.log('Found Glow peptide:', glowPeptide);
    
    // Check for active vials with missing remainingAmountUnits
    const hasIssue = glowPeptide.vials && glowPeptide.vials.some(vial => 
      vial.isActive && (vial.remainingAmountUnits === undefined || vial.remainingAmountUnits === null || vial.remainingAmountUnits <= 0)
    );
    
    if (!hasIssue) {
      console.log('Glow peptide appears to be correctly configured. No fixes needed.');
      return;
    }
    
    console.log('Found issue with Glow peptide vials. Fixing...');
    
    // Fix the vials by restoring the remaining amount
    const fixedVials = glowPeptide.vials.map(vial => {
      if (vial.isActive && (vial.remainingAmountUnits === undefined || vial.remainingAmountUnits === null || vial.remainingAmountUnits <= 0)) {
        console.log(`Fixing vial ${vial.id} by restoring amount to 10 units.`);
        return {
          ...vial,
          remainingAmountUnits: 10 // Set a reasonable default
        };
      }
      return vial;
    });
    
    // Ensure dose logs are correctly formatted
    const fixedDoseLogs = glowPeptide.doseLogs?.map(log => {
      if (log.amount !== undefined && log.dosage === undefined) {
        console.log(`Fixing doseLog ${log.id} by adding dosage field`);
        return {
          ...log,
          dosage: log.amount
        };
      }
      return log;
    });
    
    // Update the peptide
    const { data, error: updateError } = await supabase
      .from('peptides')
      .update({
        vials: fixedVials,
        doseLogs: fixedDoseLogs
      })
      .eq('id', glowPeptide.id)
      .select();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('Successfully fixed Glow peptide:', data);
  } catch (error) {
    console.error('Error fixing Glow peptide:', error);
  }
}

// Run the fix function
fixGlowPeptide().then(() => console.log('Done.'));