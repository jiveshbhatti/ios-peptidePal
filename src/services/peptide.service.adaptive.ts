import { getSupabaseClient } from './supabase-dynamic';
import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { getStoredPeptides, storePeptides } from '@/utils/storage';
import { config } from '../config';

// Determine which column naming style to use based on environment
console.log(`DETECTING ENVIRONMENT: isProduction=${config.isProduction}, isDevelopment=${config.isDevelopment}, supabase.label=${config.supabase.label}`);

// IMPORTANT: After actual table inspection, we found that the database uses camelCase
// column names in the table definition, but has inconsistent schema cache behavior
const columnNames = {
  doseLogs: 'doseLogs',          // Use actual camelCase as in table definition
  typicalDosageUnits: 'typicalDosageUnits',
  dataAiHint: 'dataAiHint',
  startDate: 'startDate'
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
      .single();

    if (error) {
      console.error('Error fetching peptide:', error);
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
      .single();

    if (error) {
      console.error('Error updating peptide:', error);
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
    updates[columnNames.doseLogs] = [...(peptide.doseLogs || []), newDoseLog];
    
    // Log detailed update information
    console.log(`Using column name '${columnNames.doseLogs}' for dose logs`);
    console.log(`Complete update payload: ${JSON.stringify(updates)}`);
    console.log(`Environment: ${config.supabase.label}, isProduction: ${config.isProduction}`);
    
    // IMPORTANT: Do NOT add other column name variants as fallbacks
    // Our testing shows that including both camelCase and lowercase column names
    // in the same update causes the database to fail with schema cache errors

    return this.updatePeptide(peptideId, updates);
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

    console.log(`Reverting dose log for ${peptide.name}, doseLog:`, doseLog);

    // Find the vial and restore the amount
    const updatedVials = peptide.vials?.map(v => {
      if (v.id === doseLog.vialId) {
        // Get the amount from the dose log (either amount or dosage field)
        const doseAmount = doseLog.dosage || doseLog.amount || 0;
        
        // Calculate the units to restore based on typical dose amount
        // If typical dose is 300mcg and log was 600mcg, we restore 2 units to the vial
        const typicalDose = peptide.typicalDosageUnits || 300;
        const unitsToRestore = Math.ceil(doseAmount / typicalDose);
        
        const newRemainingAmount = v.remainingAmountUnits + unitsToRestore;
        console.log(`Reverting dose log for ${peptide.name}: restoring ${unitsToRestore} units (${doseAmount}${doseLog.unit || 'mcg'}) to vial ${v.id}, current amount ${v.remainingAmountUnits} -> new amount ${newRemainingAmount}`);
        
        return {
          ...v,
          remainingAmountUnits: newRemainingAmount,
        };
      }
      return v;
    });

    // Remove dose log - use correct column name for current environment
    const updates: any = {
      vials: updatedVials,
    };
    
    // Use lowercase column names as that's what works in the database
    updates[columnNames.doseLogs] = peptide.doseLogs?.filter(log => log.id !== doseLogId);
    
    // Log detailed update information for debugging
    console.log(`Using column name '${columnNames.doseLogs}' for dose log removal`);
    console.log(`Complete update payload: ${JSON.stringify(updates)}`);
    console.log(`Environment: ${config.supabase.label}, isProduction: ${config.isProduction}`);
    
    // IMPORTANT: Do NOT add other column name variants as fallbacks
    // Our testing shows that including both camelCase and lowercase column names
    // in the same update causes the database to fail with schema cache errors

    const updated = await this.updatePeptide(peptideId, updates);
    console.log(`Peptide after revert update:`, updated);
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