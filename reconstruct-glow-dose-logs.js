// Script to reconstruct missing dose logs for the Glow peptide
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

async function reconstructGlowDoseLogs() {
  try {
    console.log('Starting reconstruction of Glow peptide dose logs...');
    
    // Find Glow peptide
    const { data: peptides, error: pepError } = await supabase
      .from('peptides')
      .select('*')
      .ilike('name', '%glow%');
      
    if (pepError) throw pepError;
    
    if (!peptides.length) {
      console.log('No Glow peptide found');
      return;
    }
    
    const glowPeptide = peptides[0];
    console.log('Found Glow peptide:', glowPeptide.name, `(ID: ${glowPeptide.id})`);
    
    // Find active vial
    const activeVial = glowPeptide.vials?.find(v => v.isActive);
    if (!activeVial) {
      console.log('No active vial found for Glow peptide');
      return;
    }
    
    console.log('Active vial info:', {
      initialAmount: activeVial.initialAmountUnits,
      remainingAmount: activeVial.remainingAmountUnits,
      reconstitutionDate: activeVial.reconstitutionDate
    });
    
    // Current dose logs
    const currentDoseLogs = glowPeptide.doseLogs || [];
    console.log(`Current dose logs: ${currentDoseLogs.length}`);
    currentDoseLogs.forEach((log, i) => {
      console.log(`Log ${i+1}: ${log.date} ${log.timeOfDay || ''} - ${log.dosage}${log.unit || 'mcg'}`);
    });
    
    // Known correct number of doses taken
    const correctDosesCount = 14;
    const missingDoseLogsCount = correctDosesCount - currentDoseLogs.length;
    
    if (missingDoseLogsCount <= 0) {
      console.log('No missing dose logs to reconstruct');
      return;
    }
    
    console.log(`Need to reconstruct ${missingDoseLogsCount} missing dose logs`);
    
    // Get info needed for reconstruction
    const vialId = activeVial.id;
    const reconDate = new Date(activeVial.reconstitutionDate || activeVial.dateAdded);
    const typicalDosage = glowPeptide.typicalDosageUnits || 300; // Default to 300mcg if not specified
    const dosageUnit = glowPeptide.dosageUnit || 'mcg';
    
    // Get existing dose dates to avoid duplicates
    const existingDates = new Set(currentDoseLogs.map(log => log.date.split('T')[0]));
    
    // Create synthetic dose logs
    // Start from reconstitution date and ONLY go up to YESTERDAY
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const endDate = yesterday; // Stop at yesterday to avoid conflicts with future scheduling
    const totalDaysAvailable = Math.floor((endDate - reconDate) / (1000 * 60 * 60 * 24));
    const daysPerDose = Math.max(1, Math.floor(totalDaysAvailable / missingDoseLogsCount));
    
    console.log(`Creating synthetic logs from ${reconDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`${totalDaysAvailable} days available for ${missingDoseLogsCount} logs`);
    
    const newDoseLogs = [];
    let currentDate = new Date(reconDate);
    
    // Add 1 day to start after reconstitution
    currentDate.setDate(currentDate.getDate() + 1);
    
    for (let i = 0; i < missingDoseLogsCount; i++) {
      // Find a date that's not already used
      while (existingDates.has(currentDate.toISOString().split('T')[0])) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // If we've gone beyond yesterday, move back to a random date between reconstitution and yesterday
      if (currentDate > endDate) {
        const startDay = reconDate.getDate();
        const endDay = endDate.getDate();
        const randomDay = startDay + Math.floor(Math.random() * (endDay - startDay));
        
        currentDate = new Date(reconDate);
        currentDate.setDate(randomDay);
        
        // Make sure it's not already used
        while (existingDates.has(currentDate.toISOString().split('T')[0])) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (currentDate > endDate) {
            currentDate = new Date(reconDate); // Try again from the beginning
          }
        }
      }
      
      // Create synthetic log
      const newLog = {
        id: `reconstructed_${Date.now()}_${i}`,
        date: currentDate.toISOString(),
        timeOfDay: "AM", // Default to morning
        dosage: typicalDosage,
        unit: dosageUnit,
        vialId: vialId,
        reconstructed: true // Flag to indicate this was reconstructed
      };
      
      newDoseLogs.push(newLog);
      existingDates.add(currentDate.toISOString().split('T')[0]);
      
      // Move to next date
      currentDate.setDate(currentDate.getDate() + daysPerDose);
    }
    
    // Double-check all dates are before today
    for (const log of newDoseLogs) {
      const logDate = new Date(log.date);
      if (logDate >= now) {
        // Move this log to a random date in the past week
        const randomDaysAgo = 2 + Math.floor(Math.random() * 7); // Between 2 and 8 days ago
        const adjustedDate = new Date(now);
        adjustedDate.setDate(adjustedDate.getDate() - randomDaysAgo);
        log.date = adjustedDate.toISOString();
        console.log(`Adjusted a future date to the past: ${log.date}`);
      }
    }
    
    console.log(`Created ${newDoseLogs.length} synthetic dose logs`);
    
    // Combine existing and new logs
    const updatedDoseLogs = [...currentDoseLogs, ...newDoseLogs];
    
    // Sort by date
    updatedDoseLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`Total dose logs after reconstruction: ${updatedDoseLogs.length}`);
    
    // Update peptide with reconstructed dose logs
    const { error: updateError } = await supabase
      .from('peptides')
      .update({ 
        "doseLogs": updatedDoseLogs 
      })
      .eq('id', glowPeptide.id);
    
    if (updateError) throw updateError;
    
    console.log('Successfully updated Glow peptide with reconstructed dose logs');
    console.log('WARNING: These logs have estimated dates and are marked as reconstructed');
    console.log('Dose log reconstruction complete!');
    
    // IMPORTANT: Also make sure the vial's remaining amount matches
    // We know it should be 33 total doses with 14 used = 19 remaining
    const initialAmount = activeVial.initialAmountUnits;
    // Calculate the correct remaining amount based on the initial amount and doses used
    const correctRemainingAmount = initialAmount - correctDosesCount;
    console.log(`Correcting vial remaining amount: ${initialAmount} initial - ${correctDosesCount} doses used = ${correctRemainingAmount} remaining`);
    
    // Update the vial to ensure correct remaining amount
    if (activeVial.remainingAmountUnits !== correctRemainingAmount) {
      console.log(`Updating vial remaining amount from ${activeVial.remainingAmountUnits} to ${correctRemainingAmount}`);
      
      const updatedVials = glowPeptide.vials.map(v => {
        if (v.id === activeVial.id) {
          return { ...v, remainingAmountUnits: correctRemainingAmount };
        }
        return v;
      });
      
      const { error: vialError } = await supabase
        .from('peptides')
        .update({ 
          "vials": updatedVials 
        })
        .eq('id', glowPeptide.id);
      
      if (vialError) throw vialError;
      
      console.log('Successfully updated vial remaining amount');
    }
    
  } catch (error) {
    console.error('Error reconstructing Glow peptide dose logs:', error);
  }
}

// Run the script
reconstructGlowDoseLogs();