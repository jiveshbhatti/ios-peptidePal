// Script to fix future-dated dose logs for the Glow peptide
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

async function fixFutureDoseLogs() {
  try {
    console.log('Starting fix for future-dated dose logs...');
    
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
    console.log(`Found Glow peptide: ${glowPeptide.name} (ID: ${glowPeptide.id})`);
    
    // Get current dose logs
    const doseLogs = glowPeptide.doseLogs || [];
    console.log(`Current dose logs: ${doseLogs.length}`);
    
    // Identify future-dated logs
    const now = new Date();
    const futureLogs = doseLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate > now;
    });
    
    console.log(`Found ${futureLogs.length} future-dated logs`);
    
    if (futureLogs.length === 0) {
      console.log('No future-dated logs to fix');
      return;
    }
    
    // Find earliest reconstitution date
    const activeVial = glowPeptide.vials?.find(v => v.isActive);
    let reconDate = new Date();
    if (activeVial && activeVial.reconstitutionDate) {
      reconDate = new Date(activeVial.reconstitutionDate);
    } else if (activeVial && activeVial.dateAdded) {
      reconDate = new Date(activeVial.dateAdded);
    } else {
      // Default to 14 days ago
      reconDate = new Date();
      reconDate.setDate(reconDate.getDate() - 14);
    }
    
    console.log(`Reconstitution date: ${reconDate.toISOString()}`);
    
    // Find earliest and latest past dates
    const pastLogs = doseLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate <= now && !log.reconstructed; // Only consider real past logs
    });
    
    // Find date range for replacements
    let earliestRealLog = reconDate;
    if (pastLogs.length > 0) {
      earliestRealLog = new Date(Math.min(...pastLogs.map(log => new Date(log.date).getTime())));
    }
    
    let latestPastDate = new Date(now);
    latestPastDate.setDate(latestPastDate.getDate() - 1); // Yesterday
    
    console.log(`Date range for replacements: ${earliestRealLog.toISOString()} to ${latestPastDate.toISOString()}`);
    
    // Generate date range between earliestRealLog and yesterday
    const dateRange = [];
    const currentDate = new Date(earliestRealLog);
    while (currentDate <= latestPastDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Generated ${dateRange.length} possible dates for replacement`);
    
    // Get existing dates to avoid duplicates
    const existingDates = new Set(doseLogs
      .filter(log => !futureLogs.includes(log))
      .map(log => log.date.split('T')[0]));
    
    console.log(`Existing dates to avoid: ${Array.from(existingDates).join(', ')}`);
    
    // Create updated logs array, replacing future dates with past dates
    const updatedLogs = doseLogs.map(log => {
      const logDate = new Date(log.date);
      
      // If this is a future log, replace with a past date
      if (logDate > now) {
        console.log(`Fixing future log: ${log.date}`);
        
        // Find an available past date
        const availableDates = dateRange.filter(date => 
          !existingDates.has(date.toISOString().split('T')[0])
        );
        
        if (availableDates.length > 0) {
          // Pick a random date from available past dates
          const randomIndex = Math.floor(Math.random() * availableDates.length);
          const newDate = availableDates[randomIndex];
          
          // Mark as used
          existingDates.add(newDate.toISOString().split('T')[0]);
          
          // Remove from dateRange
          const dateIndex = dateRange.findIndex(d => 
            d.toISOString().split('T')[0] === newDate.toISOString().split('T')[0]
          );
          if (dateIndex !== -1) {
            dateRange.splice(dateIndex, 1);
          }
          
          console.log(`  - Replaced with: ${newDate.toISOString()}`);
          
          // Return updated log
          return {
            ...log,
            date: newDate.toISOString(),
            timeOfDay: "AM" // Default to morning
          };
        } else {
          // If no available dates, use a random time on an existing date
          const randomPastDate = pastLogs.length > 0 
            ? new Date(pastLogs[Math.floor(Math.random() * pastLogs.length)].date) 
            : new Date(latestPastDate);
          
          // Adjust time slightly
          randomPastDate.setHours(
            7 + Math.floor(Math.random() * 4), // Between 7am and 11am
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60)
          );
          
          console.log(`  - No available dates, using: ${randomPastDate.toISOString()}`);
          
          // Return updated log
          return {
            ...log,
            date: randomPastDate.toISOString(),
            timeOfDay: "AM" // Default to morning
          };
        }
      }
      
      // Not a future log, keep as is
      return log;
    });
    
    // Sort logs by date
    updatedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Verify all logs are now in the past
    const stillFutureLogs = updatedLogs.filter(log => new Date(log.date) > now);
    if (stillFutureLogs.length > 0) {
      console.error(`ERROR: Still have ${stillFutureLogs.length} future logs after fix`);
      stillFutureLogs.forEach(log => {
        console.error(`  - ${log.date}`);
      });
      return;
    }
    
    console.log(`All logs are now in the past. Ready to update.`);
    
    // Update peptide with fixed dose logs
    const { error: updateError } = await supabase
      .from('peptides')
      .update({ 
        "doseLogs": updatedLogs 
      })
      .eq('id', glowPeptide.id);
    
    if (updateError) throw updateError;
    
    console.log('Successfully updated Glow peptide with fixed dose logs');
    console.log('Future date fix complete!');
    
  } catch (error) {
    console.error('Error fixing future dose logs:', error);
  }
}

// Run the script
fixFutureDoseLogs();