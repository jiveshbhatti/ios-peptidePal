/**
 * Direct peptide service that uses a different approach to updating
 * to work around schema cache issues
 */
import { getSupabaseClient } from './supabase-dynamic';
import { Peptide, DoseLog } from '@/types/peptide';

export const peptideServiceDirect = {
  /**
   * Add a dose log using a multi-step approach
   * 1. First update the vials
   * 2. Then update the dose logs in a separate operation
   */
  async addDoseLogMultiStep(
    peptideId: string,
    dose: Omit<DoseLog, 'id'>
  ): Promise<Peptide | null> {
    try {
      // Validate peptideId
      if (!peptideId) {
        console.error('DIRECT: No peptideId provided to addDoseLogMultiStep');
        return null;
      }
      
      // Get the Supabase client
      const supabase = getSupabaseClient();
      
      // Get the current peptide data
      console.log(`DIRECT: Fetching peptide with ID: ${peptideId}`);
      const { data: peptide, error: fetchError } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', peptideId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully
        
      if (fetchError) {
        console.error('Error fetching peptide:', fetchError);
        return null;
      }
      
      if (!peptide) {
        console.error(`No peptide found with ID: ${peptideId}`);
        return null;
      }
      
      // Find the active vial
      const activeVial = peptide.vials?.find(v => v.isActive);
      if (!activeVial) {
        console.error('No active vial found');
        return null;
      }
      
      // Create the new dose log
      const newDoseLog: DoseLog = {
        ...dose,
        id: Date.now().toString(),
        vialId: activeVial.id,
      };
      
      // Update the vial remaining amount
      const updatedVials = peptide.vials?.map(v => {
        if (v.id === activeVial.id) {
          const amountToDeduct = dose.dosage || dose.amount || 0;
          const typicalDose = peptide.typicaldosageunits || 300;
          const unitsToDeduct = Math.ceil(amountToDeduct / typicalDose);
          
          console.log(`DIRECT: Logging dose for ${peptide.name}: deducting ${unitsToDeduct} units from vial ${v.id}`);
          
          return {
            ...v,
            remainingAmountUnits: Math.max(0, v.remainingAmountUnits - unitsToDeduct),
          };
        }
        return v;
      });
      
      // STEP 1: Update the vials only
      console.log('DIRECT: Step 1 - Updating vials');
      const { error: vialsError } = await supabase
        .from('peptides')
        .update({ vials: updatedVials })
        .eq('id', peptideId);
        
      if (vialsError) {
        console.error('DIRECT: Error updating vials:', vialsError);
        return null;
      }
      
      // STEP 2: Update the dose logs - use lowercase as confirmed by testing
      console.log('DIRECT: Step 2 - Updating dose logs with lowercase column names');
      
      // Use doselogs or doseLogs property depending on what's available in the peptide
      const currentDoseLogs = peptide.doseLogs || peptide.doselogs || [];
      const updatedDoseLogs = [...currentDoseLogs, newDoseLog];
      
      // Use lowercase for updates as confirmed by testing
      const { error: logsError } = await supabase
        .from('peptides')
        .update({ "doselogs": updatedDoseLogs })
        .eq('id', peptideId);
        
      if (logsError) {
        console.error('DIRECT: Error updating dose logs with camelCase:', logsError);
        return null;
      }
      
      // Get the updated peptide
      const { data: updatedPeptide, error: getError } = await supabase
        .from('peptides')
        .select('*')
        .eq('id', peptideId)
        .maybeSingle(); // Use maybeSingle() to handle no rows gracefully
        
      if (getError) {
        console.error('DIRECT: Error getting updated peptide:', getError);
        return null;
      }
      
      if (!updatedPeptide) {
        console.error(`DIRECT: No peptide found after update with ID: ${peptideId}`);
        return null;
      }
      
      return updatedPeptide;
    } catch (error) {
      console.error('DIRECT: Unexpected error in addDoseLogMultiStep:', error);
      return null;
    }
  }
};