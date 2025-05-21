// Fix Glow peptide vial script
const { createClient } = require('@supabase/supabase-js');

// Same Supabase credentials as the main app
const SUPABASE_URL = 'https://yawjzpovpfccgisrrfjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixGlowVial() {
  try {
    console.log('Fetching Glow peptide from database...');
    
    // Get Glow peptide
    const { data: peptides, error } = await supabase
      .from('peptides')
      .select('*')
      .eq('name', 'Glow');
    
    if (error) {
      throw error;
    }
    
    if (peptides.length === 0) {
      console.log('No Glow peptide found.');
      return;
    }
    
    const glowPeptide = peptides[0];
    console.log('Found Glow peptide with ID:', glowPeptide.id);
    
    // Update the active vial's remaining amount
    const updatedVials = glowPeptide.vials.map(vial => {
      if (vial.isActive) {
        console.log(`Updating vial ${vial.id}, current remainingAmountUnits: ${vial.remainingAmountUnits}`);
        return {
          ...vial,
          // Set to a more reasonable amount - we already have 13 dose logs
          remainingAmountUnits: 20
        };
      }
      return vial;
    });
    
    // Update the peptide record
    const { data: updated, error: updateError } = await supabase
      .from('peptides')
      .update({
        vials: updatedVials
      })
      .eq('id', glowPeptide.id)
      .select();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('Successfully updated Glow vial:', updated);
  } catch (error) {
    console.error('Error fixing Glow vial:', error);
  }
}

// Run the fix function
fixGlowVial().then(() => console.log('Done.'));