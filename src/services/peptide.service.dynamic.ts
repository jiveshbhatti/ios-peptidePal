import { getSupabaseClient } from './supabase-dynamic';
import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { getStoredPeptides, storePeptides } from '@/utils/storage';

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

  async updatePeptide(id: string, updates: Partial<Peptide>): Promise<Peptide | null> {
    // Get the current Supabase client
    const supabase = getSupabaseClient();
    
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

    // Simply add the dose log without updating remainingAmountUnits
    // The remaining doses will be calculated from the dose logs
    console.log(`Logging dose for ${peptide.name}: ${dose.dosage || (dose as any).amount || 0}${dose.unit || 'mcg'} for vial ${activeVial.id}`);

    // Add dose log - use lowercase keys for Supabase
    const updates: any = {
      doselogs: [...(peptide.doseLogs || []), newDoseLog],
    };

    const updatedPeptide = await this.updatePeptide(peptideId, updates);
    
    if (updatedPeptide) {
      // Import the calculation function
      const { calculateUsedDosesFromLogs } = await import('@/utils/dose-calculations');
      const { inventoryService } = await import('./inventory.service');
      
      // Calculate total used doses from dose logs
      const usedDoses = calculateUsedDosesFromLogs(updatedPeptide, activeVial.id);
      
      // Update inventory peptide with usage tracking
      await inventoryService.updatePeptideUsage(peptideId, usedDoses);
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
    const updates: any = {
      doselogs: peptide.doseLogs?.filter(log => log.id !== doseLogId),
    };

    const updated = await this.updatePeptide(peptideId, updates);
    console.log(`Peptide after removing dose log:`, updated);
    
    if (updated) {
      // Import the calculation function
      const { calculateUsedDosesFromLogs } = await import('@/utils/dose-calculations');
      const { inventoryService } = await import('./inventory.service');
      
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

    return this.updatePeptide(peptideId, { vials: updatedVials });
  },
};