import { Peptide } from '@/types/peptide';
import { InventoryPeptide } from '@/types/inventory';

/**
 * Calculate remaining doses for a peptide based on its active vial and dose logs
 * This provides a single source of truth for dose calculations using actual dose logs
 */
export function calculateRemainingDoses(
  peptide: Peptide | null | undefined,
  inventoryPeptide?: InventoryPeptide | null
): number {
  if (!peptide) return 0;
  
  // Find the current/active vial
  const activeVial = peptide.vials?.find(v => v.isCurrent || (v.isActive && !peptide.vials.some(vial => vial.isCurrent)));
  
  if (!activeVial) {
    // No active vial, check if we have inventory data
    if (inventoryPeptide && 
        inventoryPeptide.active_vial_status === 'IN_USE' && 
        inventoryPeptide.concentration_per_vial_mcg && 
        inventoryPeptide.typical_dose_mcg) {
      // Calculate total doses based on inventory data
      const totalDoses = Math.floor(
        inventoryPeptide.concentration_per_vial_mcg / inventoryPeptide.typical_dose_mcg
      );
      
      // Check for usage tracking in batch_number field (temporary hack)
      if (inventoryPeptide.batch_number?.startsWith('USAGE:')) {
        try {
          const usedDoses = parseInt(inventoryPeptide.batch_number.split('USAGE:')[1], 10);
          return Math.max(0, totalDoses - usedDoses);
        } catch (error) {
          console.error('Error parsing usage from batch_number:', error);
        }
      }
      
      // Default to full vial if no usage data
      return totalDoses;
    }
    return 0;
  }
  
  // We have an active vial - calculate based on dose logs
  const initialDoses = activeVial.initialAmountUnits || 0;
  
  // Calculate total doses used from dose logs for this vial
  const usedDoses = calculateUsedDosesFromLogs(peptide, activeVial.id);
  
  const remainingDoses = Math.max(0, initialDoses - usedDoses);
  
  // Debug logging
  if (peptide.name === 'Glow' || peptide.name === 'Retatrutide') {
    console.log(`${peptide.name} dose calculation (from logs):`, {
      initialAmountUnits: activeVial.initialAmountUnits,
      usedDoses: usedDoses,
      remainingDoses: remainingDoses,
      typicalDoseUnits: peptide.typicalDosageUnits,
      interpretation: 'Calculated from actual dose logs',
      hasLogs: !!(peptide.doseLogs && peptide.doseLogs.length > 0),
      logCount: peptide.doseLogs?.length || 0
    });
  }
  
  return Math.max(0, Math.floor(remainingDoses));
}

/**
 * Calculate total doses per vial based on concentration and typical dose
 */
export function calculateTotalDosesPerVial(
  concentrationMcg: number | null | undefined,
  typicalDoseMcg: number | null | undefined
): number {
  if (!concentrationMcg || !typicalDoseMcg || typicalDoseMcg === 0) {
    return 0;
  }
  
  return Math.floor(concentrationMcg / typicalDoseMcg);
}

/**
 * Calculate used doses for a peptide based on dose logs
 */
export function calculateUsedDoses(
  peptide: Peptide | null | undefined,
  inventoryPeptide?: InventoryPeptide | null
): number {
  if (!peptide) return 0;
  
  // Find the current/active vial
  const activeVial = peptide.vials?.find(v => v.isCurrent || (v.isActive && !peptide.vials.some(vial => vial.isCurrent)));
  
  if (!activeVial) {
    // Check inventory data for usage tracking
    if (inventoryPeptide?.batch_number?.startsWith('USAGE:')) {
      try {
        return parseInt(inventoryPeptide.batch_number.split('USAGE:')[1], 10);
      } catch (error) {
        console.error('Error parsing usage from batch_number:', error);
      }
    }
    return 0;
  }
  
  // Calculate used doses from dose logs for the active vial
  return calculateUsedDosesFromLogs(peptide, activeVial.id);
}

/**
 * Calculate used doses from dose logs for a specific vial
 */
export function calculateUsedDosesFromLogs(
  peptide: Peptide,
  vialId: string
): number {
  if (!peptide.doseLogs || peptide.doseLogs.length === 0) {
    return 0;
  }
  
  // Get the typical dose to calculate units
  const typicalDose = peptide.typicalDosageUnits || 300; // default to 300mcg if not set
  
  // Sum up all doses for this vial
  let totalUnitsUsed = 0;
  let logsForVial = 0;
  
  for (const log of peptide.doseLogs) {
    if (log.vialId === vialId) {
      logsForVial++;
      // Get the dose amount (dosage is the correct field, but check amount for backward compatibility)
      const doseAmount = log.dosage || (log as any).amount || 0;
      
      // Calculate units used for this dose
      // If typical dose is 300mcg and user logged 600mcg, that's 2 units
      const unitsUsed = Math.ceil(doseAmount / typicalDose);
      totalUnitsUsed += unitsUsed;
    }
  }
  
  // Debug log for Glow
  if (peptide.name === 'Glow') {
    console.log(`Glow used doses calculation:`, {
      vialId,
      totalDoseLogs: peptide.doseLogs.length,
      logsForThisVial: logsForVial,
      typicalDose,
      totalUnitsUsed
    });
  }
  
  return totalUnitsUsed;
}

/**
 * Format dose count display with warning for low stock
 */
export function formatDoseDisplay(remainingDoses: number): {
  text: string;
  isLowStock: boolean;
} {
  const isLowStock = remainingDoses > 0 && remainingDoses < 3;
  
  if (remainingDoses === 0) {
    return { text: 'No doses remaining', isLowStock: true };
  } else if (remainingDoses === 1) {
    return { text: '1 dose left', isLowStock: true };
  } else {
    return { text: `${remainingDoses} doses left`, isLowStock };
  }
}

/**
 * Calculate volume to draw in insulin units (100 units = 1mL)
 * @param doseMcg - Dose in micrograms
 * @param concentrationMcgPerMl - Concentration in mcg/mL
 * @param bacWaterMl - Amount of BAC water used for reconstitution
 * @returns Volume in insulin units (rounded to nearest unit)
 */
export function calculateDrawVolume(
  doseMcg: number,
  concentrationMcgPerMl: number | null | undefined,
  bacWaterMl: number | null | undefined
): number {
  // If we don't have concentration or BAC water info, return 0
  if (!concentrationMcgPerMl || !bacWaterMl || bacWaterMl === 0) {
    return 0;
  }
  
  // Calculate actual concentration after reconstitution
  // concentrationMcgPerMl is the total mcg in the vial
  // After adding BAC water, the concentration is: total mcg / BAC water mL
  const actualConcentration = concentrationMcgPerMl / bacWaterMl;
  
  // Calculate volume in mL
  const volumeMl = doseMcg / actualConcentration;
  
  // Convert to insulin units (100 units = 1mL)
  const volumeUnits = volumeMl * 100;
  
  // Round to nearest unit
  return Math.round(volumeUnits);
}

/**
 * Get draw volume for a peptide based on its active vial
 */
export function getDrawVolumeForPeptide(
  peptide: Peptide, 
  inventoryPeptide?: InventoryPeptide | null
): number {
  const activeVial = peptide.vials?.find(v => v.isCurrent || (v.isActive && !peptide.vials.some(vial => vial.isCurrent)));
  
  // Debug logging for peptides without volume display
  if ((peptide.name === 'Glow' || peptide.name === 'NAD+' || peptide.name === 'Retatrutide') && activeVial) {
    console.log(`=== ${peptide.name} Draw Volume Debug ===`);
    console.log('Peptide typical dose:', peptide.typicalDosageUnits);
    console.log('Active vial has BAC water:', !!activeVial.reconstitutionBacWaterMl);
    console.log('Active vial has total MCG:', !!activeVial.totalPeptideInVialMcg);
    if (activeVial) {
      console.log('  reconstitutionBacWaterMl:', activeVial.reconstitutionBacWaterMl);
      console.log('  totalPeptideInVialMcg:', activeVial.totalPeptideInVialMcg);
    }
  }
  
  // First check if vial has reconstitution info
  if (activeVial && activeVial.reconstitutionBacWaterMl) {
    let totalMcgInVial = activeVial.totalPeptideInVialMcg || 0;
    
    // Special handling for peptides if totalPeptideInVialMcg is missing
    if (!totalMcgInVial) {
      // Try to get from inventory data first
      if (inventoryPeptide?.concentration_per_vial_mcg) {
        totalMcgInVial = inventoryPeptide.concentration_per_vial_mcg;
        console.log(`Using inventory concentration ${totalMcgInVial}mcg for ${peptide.name}`);
      } else {
        // Default vial sizes for known peptides
        const defaultVialSizes: { [key: string]: number } = {
          'Glow': 10000,     // 10mg = 10000mcg
          'NAD+': 500000,    // 500mg = 500,000mcg (based on your screenshot)
          'Retatrutide': 10000, // 10mg = 10000mcg
        };
        
        if (defaultVialSizes[peptide.name]) {
          totalMcgInVial = defaultVialSizes[peptide.name];
          console.log(`Using default ${totalMcgInVial}mcg for ${peptide.name} vial`);
        }
      }
    }
    
    const doseMcg = peptide.typicalDosageUnits || 0;
    const bacWaterMl = activeVial.reconstitutionBacWaterMl;
    
    const result = calculateDrawVolume(doseMcg, totalMcgInVial, bacWaterMl);
    if (peptide.name === 'Glow' || peptide.name === 'NAD+' || peptide.name === 'Retatrutide') {
      console.log(`Calculated volume for ${peptide.name}: ${result} units`);
      console.log(`  doseMcg: ${doseMcg}, totalMcgInVial: ${totalMcgInVial}, bacWaterMl: ${bacWaterMl}`);
    }
    return result;
  }
  
  // Fallback to inventory data if available
  if (inventoryPeptide && 
      inventoryPeptide.bac_water_volume_added && 
      inventoryPeptide.concentration_per_vial_mcg &&
      inventoryPeptide.typical_dose_mcg) {
    const result = calculateDrawVolume(
      inventoryPeptide.typical_dose_mcg,
      inventoryPeptide.concentration_per_vial_mcg,
      inventoryPeptide.bac_water_volume_added
    );
    if (peptide.name === 'Glow' || peptide.name === 'NAD+') {
      console.log(`Calculated from inventory for ${peptide.name}: ${result} units`);
    }
    return result;
  }
  
  if (peptide.name === 'Glow' || peptide.name === 'NAD+') {
    console.log(`No BAC water data found for ${peptide.name}, returning 0`);
  }
  
  return 0;
}