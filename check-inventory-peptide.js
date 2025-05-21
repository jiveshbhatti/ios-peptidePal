// Script to check inventory_peptides table
const { createClient } = require('@supabase/supabase-js');

async function checkInventoryPeptide() {
  // Production database credentials
  const supabase = createClient(
    'https://yawjzpovpfccgisrrfjo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd2p6cG92cGZjY2dpc3JyZmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTg4MDksImV4cCI6MjA2MjU3NDgwOX0.n00tZcmuTEdC8gEPD63_bedFsO8iQv5YMWOPboKnT2o'
  );

  console.log('Connecting to production database...');

  try {
    // Check inventory_peptides table
    console.log('Checking inventory_peptides table...');
    
    // First, get the peptide to find its ID
    const { data: peptide, error: peptideError } = await supabase
      .from('peptides')
      .select('*')
      .eq('name', 'Glow')
      .single();
      
    if (peptideError) {
      console.error('Error fetching Glow peptide:', peptideError);
      return;
    }
    
    console.log('Glow peptide ID:', peptide.id);
    
    // Now look for the same peptide in inventory_peptides
    console.log('Fetching inventory peptides...');
    const { data: inventoryPeptides, error: invError } = await supabase
      .from('inventory_peptides')
      .select('*');
      
    if (invError) {
      console.error('Error fetching inventory peptides:', invError);
      return;
    }
    
    console.log(`Found ${inventoryPeptides.length} inventory peptides`);
    
    // Find Glow in inventory
    const glowInv = inventoryPeptides.find(p => p.name === 'Glow');
    
    if (!glowInv) {
      console.log('Glow not found in inventory_peptides!');
      
      // Look for any peptide with similar name
      const similarPeptides = inventoryPeptides.filter(p => 
        p.name.toLowerCase().includes('glow'));
      
      if (similarPeptides.length > 0) {
        console.log('Found similar peptides:', similarPeptides.map(p => p.name));
      }
      
      return;
    }
    
    console.log('Found Glow in inventory_peptides:');
    console.log(JSON.stringify(glowInv, null, 2));
    
    // Check active vial status
    if (glowInv.active_vial_status) {
      console.log(`Active vial status: ${glowInv.active_vial_status}`);
    }
    
    // Check all table columns
    console.log('Inventory peptide columns:', Object.keys(glowInv).join(', '));
    
    // Check for any fields related to doses or usage
    console.log('Looking for dose or usage related fields...');
    for (const [key, value] of Object.entries(glowInv)) {
      if (
        key.includes('dose') || 
        key.includes('usage') || 
        key.includes('remaining') ||
        key.includes('vial')
      ) {
        console.log(`${key}: ${value}`);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the check
checkInventoryPeptide();