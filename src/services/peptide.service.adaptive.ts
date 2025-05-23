import { getSupabaseClient } from './supabase-dynamic';
import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { getStoredPeptides, storePeptides } from '@/utils/storage';
import { config } from '../config';
import { inventoryService } from './inventory.service';

// Determine which column naming style to use based on environment
console.log(`DETECTING ENVIRONMENT: isProduction=${config.isProduction}, isDevelopment=${config.isDevelopment}, supabase.label=${config.supabase.label}`);

// IMPORTANT: After actual table inspection, we found that the database uses lowercase
// column names despite what the schema might suggest
const columnNames = {
  doseLogs: 'doselogs',          // Use lowercase as confirmed by testing
  typicalDosageUnits: 'typicaldosageunits',
  dataAiHint: 'dataaihint',
  startDate: 'startdate'
};

console.log(`Using column names: ${JSON.stringify(columnNames)}`);

// Export a function to check which column format works
export async function testColumnNames() {
  try {
    const supabase = getSupabaseClient();
    
    // Create a test peptide
    const testId = `test-${Date.now()}`;
    const testPeptide = {
      id: testId,
      name: 'COLUMN-TEST',
    };
    
    // Insert the test peptide
    const { error: insertError } = await supabase
      .from('peptides')
      .insert(testPeptide);
      
    if (insertError) {
      console.log("❌ Failed to insert test peptide:", insertError.message);
      return { camelCase: false, lowercase: false };
    }
    
    // Test camelCase update
    const camelUpdate = { doseLogs: [] };
    const { error: camelError } = await supabase
      .from('peptides')
      .update(camelUpdate)
      .eq('id', testId);
      
    const camelWorks = !camelError;
    
    // Test lowercase update
    const lowerUpdate = { doselogs: [] };
    const { error: lowerError } = await supabase
      .from('peptides')
      .update(lowerUpdate)
      .eq('id', testId);
      
    const lowerWorks = !lowerError;
    
    // Clean up
    await supabase
      .from('peptides')
      .delete()
      .eq('id', testId);
      
    return { camelCase: camelWorks, lowercase: lowerWorks };
  } catch (err) {
    console.error("Error testing column names:", err);
    return { camelCase: false, lowercase: false };
  }
}

export const peptideService = {
  async getPeptides(): Promise<Peptide[]> {
    try {
      // Get the current Supabase client
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('peptides')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Fall back to cached data if offline
      console.error('Error fetching peptides:', error);
      return await getStoredPeptides();
    }
  },

  async getPeptideById(id: string): Promise<Peptide | null> {
    // Get the current Supabase client
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('peptides')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() to handle no rows gracefully

    if (error) {
      console.error('Error fetching peptide:', error);
      return null;
    }

    if (!data) {
      console.error(`No peptide found with ID: ${id}`);
      return null;
    }

    return data;
  },

  async updatePeptide(id: string, updates: any): Promise<Peptide | null> {
    // Get the current Supabase client
    const supabase = getSupabaseClient();
    
    console.log(`Updating peptide ${id} with fields: ${JSON.stringify(Object.keys(updates))}`);
    console.log(`Update payload: ${JSON.stringify(updates)}`);
    
    const { data, error } = await supabase
      .from('peptides')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle(); // Use maybeSingle() to handle no rows gracefully

    if (error) {
      console.error('Error updating peptide:', error);
      return null;
    }

    if (!data) {
      console.error(`No peptide returned after update with ID: ${id}`);
      return null;
    }

    // Update cache
    const peptides = await this.getPeptides();
    await storePeptides(peptides);

    return data;
  },

  async addDoseLog(
    peptideId: string,
    dose: Omit<DoseLog, 'id'>
  ): Promise<Peptide | null> {
    // Validate peptideId
    if (!peptideId) {
      console.error('No peptideId provided to addDoseLog');
      return null;
    }
    
    const peptide = await this.getPeptideById(peptideId);
    if (!peptide) return null;

    // Find the active vial
    const activeVial = peptide.vials?.find(v => v.isActive);
    if (!activeVial) {
      console.error('No active vial found');
      return null;
    }

    // Create new dose log
    const newDoseLog: DoseLog = {
      ...dose,
      id: Date.now().toString(),
      vialId: activeVial.id,
    };

    // Update vial remaining amount
    const updatedVials = peptide.vials?.map(v => {
      if (v.id === activeVial.id) {
        // Use dose.dosage (correct field according to DoseLog interface) but fall back to dose.amount for backward compatibility
        const amountToDeduct = dose.dosage || dose.amount || 0;
        
        // Calculate the units to deduct based on typical dose amount
        // If typical dose is 300mcg and user logs 600mcg, we deduct 2 units from the vial
        const typicalDose = peptide.typicalDosageUnits || 300;
        const unitsToDeduct = Math.ceil(amountToDeduct / typicalDose);
        
        console.log(`Logging dose for ${peptide.name}: deducting ${unitsToDeduct} units (${amountToDeduct}${dose.unit}) from vial ${v.id} with current amount ${v.remainingAmountUnits}`);
        
        return {
          ...v,
          remainingAmountUnits: Math.max(0, v.remainingAmountUnits - unitsToDeduct),
        };
      }
      return v;
    });

    // Add dose log and update vials - use correct column name for current environment
    const updates: any = {
      vials: updatedVials,
    };
    
    // Use lowercase column names as that's what works in the database
    updates[columnNames.doseLogs] = [...(peptide.doseLogs || peptide.doselogs || []), newDoseLog];
    
    // Log detailed update information
    console.log(`Using column name '${columnNames.doseLogs}' for dose logs`);
    console.log(`Complete update payload: ${JSON.stringify(updates)}`);
    console.log(`Environment: ${config.supabase.label}, isProduction: ${config.isProduction}`);
    
    // IMPORTANT: Do NOT add other column name variants as fallbacks
    // Our testing shows that including both camelCase and lowercase column names
    // in the same update causes the database to fail with schema cache errors

    const updatedPeptide = await this.updatePeptide(peptideId, updates);
    
    // Sync usage tracking to inventory for consistency
    if (updatedPeptide) {
      const totalDoseLogs = updatedPeptide.doseLogs?.length || updatedPeptide.doselogs?.length || 0;
      await inventoryService.updatePeptideUsage(peptideId, totalDoseLogs);
    }
    
    return updatedPeptide;
  },

  async removeDoseLog(
    peptideId: string,
    doseLogId: string
  ): Promise<Peptide | null> {
    const peptide = await this.getPeptideById(peptideId);
    if (!peptide) {
      console.error(`No peptide found with ID: ${peptideId}`);
      return null;
    }

    const doseLog = peptide.doseLogs?.find(log => log.id === doseLogId);
    if (!doseLog) {
      console.error(`No dose log found with ID: ${doseLogId}`);
      return null;
    }

    console.log(`Removing dose log for ${peptide.name}, doseLogId: ${doseLogId}`);

    // Simply remove the dose log without updating remainingAmountUnits
    // The remaining doses will be calculated from the dose logs
    const updates: any = {};
    
    // Use lowercase column names as that's what works in the database
    updates[columnNames.doseLogs] = (peptide.doseLogs || peptide.doselogs)?.filter(log => log.id !== doseLogId);
    
    // Log detailed update information for debugging
    console.log(`Using column name '${columnNames.doseLogs}' for dose log removal`);
    console.log(`Complete update payload: ${JSON.stringify(updates)}`);
    console.log(`Environment: ${config.supabase.label}, isProduction: ${config.isProduction}`);
    
    // IMPORTANT: Do NOT add other column name variants as fallbacks
    // Our testing shows that including both camelCase and lowercase column names
    // in the same update causes the database to fail with schema cache errors

    const updated = await this.updatePeptide(peptideId, updates);
    console.log(`Peptide after revert update:`, updated);
    
    // Sync usage tracking to inventory for consistency
    if (updated) {
      // Import the calculation function
      const { calculateUsedDosesFromLogs } = await import('@/utils/dose-calculations');
      
      // Find the active vial
      const activeVial = updated.vials?.find(v => v.isActive);
      if (activeVial) {
        // Calculate total used doses from dose logs
        const usedDoses = calculateUsedDosesFromLogs(updated, activeVial.id);
        
        // Update inventory peptide with usage tracking
        await inventoryService.updatePeptideUsage(peptideId, usedDoses);
      }
    }
    
    return updated;
  },

  async activateVial(peptideId: string, vialId: string): Promise<Peptide | null> {
    const peptide = await this.getPeptideById(peptideId);
    if (!peptide) return null;

    // Deactivate all vials and activate the selected one
    const updatedVials = peptide.vials?.map(v => ({
      ...v,
      isActive: v.id === vialId,
    }));

    // Only update vials, no need to worry about case sensitivity here
    return this.updatePeptide(peptideId, { vials: updatedVials });
  },
};