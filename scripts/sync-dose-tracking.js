#!/usr/bin/env node

/**
 * Script to sync dose tracking between peptides and inventory
 * This ensures the dose counts are consistent across both systems
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncDoseTracking() {
  try {
    console.log('🔄 Starting dose tracking synchronization...\n');
    
    // Get all peptides
    const { data: peptides, error: peptidesError } = await supabase
      .from('peptides')
      .select('*')
      .order('name');
    
    if (peptidesError) {
      throw peptidesError;
    }
    
    console.log(`Found ${peptides.length} peptides to check\n`);
    
    for (const peptide of peptides) {
      console.log(`\n📊 Processing: ${peptide.name} (ID: ${peptide.id})`);
      
      // Count dose logs
      const doseLogs = peptide.doselogs || peptide.doseLogs || [];
      const doseCount = doseLogs.length;
      console.log(`  - Found ${doseCount} dose logs`);
      
      // Get corresponding inventory peptide
      const { data: inventoryPeptide, error: invError } = await supabase
        .from('inventory_peptides')
        .select('*')
        .eq('id', peptide.id)
        .single();
      
      if (invError) {
        console.log(`  ⚠️  No inventory entry found for this peptide`);
        continue;
      }
      
      // Check active vial information
      if (inventoryPeptide.active_vial_status === 'IN_USE') {
        console.log(`  - Active vial found`);
        console.log(`  - Concentration: ${inventoryPeptide.concentration_per_vial_mcg}mcg`);
        console.log(`  - Typical dose: ${inventoryPeptide.typical_dose_mcg}mcg`);
        
        if (inventoryPeptide.concentration_per_vial_mcg && inventoryPeptide.typical_dose_mcg) {
          const totalDoses = Math.floor(
            inventoryPeptide.concentration_per_vial_mcg / inventoryPeptide.typical_dose_mcg
          );
          console.log(`  - Total doses per vial: ${totalDoses}`);
          
          // Check current tracking
          const currentTracking = inventoryPeptide.batch_number;
          if (currentTracking && currentTracking.startsWith('USAGE:')) {
            const trackedCount = parseInt(currentTracking.split('USAGE:')[1], 10);
            console.log(`  - Currently tracked: ${trackedCount} doses used`);
            
            if (trackedCount !== doseCount) {
              console.log(`  ⚠️  Mismatch detected! Updating to ${doseCount}`);
              
              // Update the tracking
              const { error: updateError } = await supabase
                .from('inventory_peptides')
                .update({ batch_number: `USAGE:${doseCount}` })
                .eq('id', peptide.id);
              
              if (updateError) {
                console.error(`  ❌ Failed to update: ${updateError.message}`);
              } else {
                console.log(`  ✅ Updated successfully`);
              }
            } else {
              console.log(`  ✅ Tracking is already correct`);
            }
          } else {
            // Initialize tracking
            console.log(`  🆕 Initializing tracking to ${doseCount} doses used`);
            
            const { error: updateError } = await supabase
              .from('inventory_peptides')
              .update({ batch_number: `USAGE:${doseCount}` })
              .eq('id', peptide.id);
            
            if (updateError) {
              console.error(`  ❌ Failed to initialize: ${updateError.message}`);
            } else {
              console.log(`  ✅ Initialized successfully`);
            }
          }
        }
      } else {
        console.log(`  - No active vial (status: ${inventoryPeptide.active_vial_status})`);
      }
    }
    
    console.log('\n\n✅ Dose tracking synchronization complete!');
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    process.exit(1);
  }
}

// Run the sync
syncDoseTracking().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});