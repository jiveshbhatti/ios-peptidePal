#!/usr/bin/env node

/**
 * Script to recalculate remainingAmountUnits for all vials based on actual dose logs
 * This ensures data consistency after switching to dose-log-based calculations
 */

import { firebaseCleanService } from '../src/services/firebase-clean.js';
import { calculateUsedDosesFromLogs } from '../src/utils/dose-calculations.js';

async function recalculateRemainingDoses() {
  try {
    console.log('Starting dose recalculation based on dose logs...\n');
    
    // Get all peptides
    const peptides = await firebaseCleanService.getPeptides();
    console.log(`Found ${peptides.length} peptides to process\n`);
    
    let totalVials = 0;
    let updatedVials = 0;
    
    for (const peptide of peptides) {
      console.log(`\nProcessing ${peptide.name}:`);
      
      if (!peptide.vials || peptide.vials.length === 0) {
        console.log('  - No vials found');
        continue;
      }
      
      for (const vial of peptide.vials) {
        totalVials++;
        const initialDoses = vial.initialAmountUnits || 0;
        const currentRemaining = vial.remainingAmountUnits || 0;
        
        // Calculate used doses from dose logs
        const usedDoses = calculateUsedDosesFromLogs(peptide, vial.id);
        const calculatedRemaining = Math.max(0, initialDoses - usedDoses);
        
        console.log(`  - Vial ${vial.id}:`);
        console.log(`    Initial doses: ${initialDoses}`);
        console.log(`    Used doses (from logs): ${usedDoses}`);
        console.log(`    Current remaining: ${currentRemaining}`);
        console.log(`    Calculated remaining: ${calculatedRemaining}`);
        
        if (currentRemaining !== calculatedRemaining) {
          console.log(`    ⚠️  MISMATCH - Would update from ${currentRemaining} to ${calculatedRemaining}`);
          updatedVials++;
          
          // Uncomment the following lines to actually update the database
          // await firebaseCleanService.updateVialRemaining(peptide.id, vial.id, calculatedRemaining);
          // console.log(`    ✅ Updated successfully`);
        } else {
          console.log(`    ✓ Already correct`);
        }
      }
    }
    
    console.log(`\n\nSummary:`);
    console.log(`Total vials: ${totalVials}`);
    console.log(`Vials needing update: ${updatedVials}`);
    console.log(`\nNote: This was a dry run. Uncomment the update code to apply changes.`);
    
  } catch (error) {
    console.error('Error during recalculation:', error);
    process.exit(1);
  }
}

// Run the script
recalculateRemainingDoses();