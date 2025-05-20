import { supabase } from './supabase';
import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { getStoredPeptides, storePeptides } from '@/utils/storage';

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
        return {
          ...v,
          remainingAmountUnits: Math.max(0, v.remainingAmountUnits - dose.amount),
        };
      }
      return v;
    });

    // Add dose log and update vials
    const updates: Partial<Peptide> = {
      doseLogs: [...(peptide.doseLogs || []), newDoseLog],
      vials: updatedVials,
    };

    return this.updatePeptide(peptideId, updates);
  },

  async removeDoseLog(
    peptideId: string,
    doseLogId: string
  ): Promise<Peptide | null> {
    const peptide = await this.getPeptideById(peptideId);
    if (!peptide) return null;

    const doseLog = peptide.doseLogs?.find(log => log.id === doseLogId);
    if (!doseLog) return null;

    // Find the vial and restore the amount
    const updatedVials = peptide.vials?.map(v => {
      if (v.id === doseLog.vialId) {
        return {
          ...v,
          remainingAmountUnits: v.remainingAmountUnits + doseLog.amount,
        };
      }
      return v;
    });

    // Remove dose log
    const updates: Partial<Peptide> = {
      doseLogs: peptide.doseLogs?.filter(log => log.id !== doseLogId),
      vials: updatedVials,
    };

    return this.updatePeptide(peptideId, updates);
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