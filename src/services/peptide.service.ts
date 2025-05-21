import { supabase } from './supabase';
import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { getStoredPeptides, storePeptides } from '@/utils/storage';
import { inventoryService } from './inventory.service';

export const peptideService = {
  async getPeptides(): Promise<Peptide[]> {
    try {
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

    // Add dose log and update vials - use camelCase keys for Supabase
    const updates: any = {
      doseLogs: [...(peptide.doseLogs || []), newDoseLog],
      vials: updatedVials,
    };

    const updatedPeptide = await this.updatePeptide(peptideId, updates);
    
    if (updatedPeptide) {
      // Calculate total used doses (Vial.initialAmountUnits - Vial.remainingAmountUnits)
      const activeVial = updatedPeptide.vials?.find(v => v.isActive);
      if (activeVial) {
        const usedDoses = Math.floor(activeVial.initialAmountUnits - activeVial.remainingAmountUnits);
        // Update inventory peptide with usage tracking
        await inventoryService.updatePeptideUsage(peptideId, usedDoses);
      }
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

    console.log(`Reverting dose log for ${peptide.name}, doseLog:`, doseLog);
    console.log(`Current vials:`, peptide.vials);

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

    console.log(`Updated vials after revert:`, updatedVials);

    // Remove dose log - use camelCase keys for Supabase
    const updates: any = {
      doseLogs: peptide.doseLogs?.filter(log => log.id !== doseLogId),
      vials: updatedVials,
    };

    const updated = await this.updatePeptide(peptideId, updates);
    console.log(`Peptide after revert update:`, updated);
    
    if (updated) {
      // Calculate total used doses (Vial.initialAmountUnits - Vial.remainingAmountUnits)
      const activeVial = updated.vials?.find(v => v.isActive);
      if (activeVial) {
        const usedDoses = Math.floor(activeVial.initialAmountUnits - activeVial.remainingAmountUnits);
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