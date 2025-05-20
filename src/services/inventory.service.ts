import { supabase } from './supabase';
import { InventoryPeptide, InventoryBacWater, InventorySyringe, InventoryOtherItem } from '@/types/inventory';
import { Peptide, Vial } from '@/types/peptide';
import { peptideService } from './peptide.service';

export const inventoryService = {
  // Peptide Inventory
  async getInventoryPeptides(): Promise<InventoryPeptide[]> {
    const { data, error } = await supabase
      .from('inventory_peptides')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching inventory peptides:', error);
      return [];
    }

    return data || [];
  },

  async addPeptideToInventory(
    inventoryData: Omit<InventoryPeptide, 'id' | 'created_at' | 'updated_at'>,
    scheduleData: {
      schedule: any;
      strength: string;
      typicalDosageUnits: number;
      dosageUnit: string;
      startDate?: string;
      notes?: string;
      dataAiHint?: string;
    }
  ): Promise<boolean> {
    try {
      // Create inventory entry
      const { data: inventoryPeptide, error: inventoryError } = await supabase
        .from('inventory_peptides')
        .insert(inventoryData)
        .select()
        .single();

      if (inventoryError) throw inventoryError;

      // Create corresponding peptide entry for scheduling
      const peptideData: Omit<Peptide, 'id'> = {
        id: inventoryPeptide.id, // Use same ID
        name: inventoryData.name,
        strength: scheduleData.strength,
        typicalDosageUnits: scheduleData.typicalDosageUnits,
        dosageUnit: scheduleData.dosageUnit,
        schedule: scheduleData.schedule,
        startDate: scheduleData.startDate,
        notes: scheduleData.notes,
        dataAiHint: scheduleData.dataAiHint,
        vials: [],
        doseLogs: [],
      };

      const { error: peptideError } = await supabase
        .from('peptides')
        .insert(peptideData);

      if (peptideError) {
        // Rollback inventory if peptide creation fails
        await supabase
          .from('inventory_peptides')
          .delete()
          .eq('id', inventoryPeptide.id);
        throw peptideError;
      }

      return true;
    } catch (error) {
      console.error('Error adding peptide to inventory:', error);
      return false;
    }
  },

  async updatePeptideInInventory(
    id: string,
    inventoryUpdates: Partial<InventoryPeptide>,
    scheduleUpdates?: Partial<Peptide>
  ): Promise<boolean> {
    try {
      // Update inventory
      const { error: inventoryError } = await supabase
        .from('inventory_peptides')
        .update(inventoryUpdates)
        .eq('id', id);

      if (inventoryError) throw inventoryError;

      // Update peptide if schedule updates provided
      if (scheduleUpdates) {
        await peptideService.updatePeptide(id, scheduleUpdates);
      }

      return true;
    } catch (error) {
      console.error('Error updating inventory peptide:', error);
      return false;
    }
  },

  async activatePeptideVial(
    peptideId: string,
    reconstitutionDate: string
  ): Promise<boolean> {
    try {
      // Get inventory peptide
      const { data: inventoryPeptide, error: invError } = await supabase
        .from('inventory_peptides')
        .select('*')
        .eq('id', peptideId)
        .single();

      if (invError || !inventoryPeptide) throw invError;

      // Update inventory (decrement vials, set active status)
      const { error: updateError } = await supabase
        .from('inventory_peptides')
        .update({
          num_vials: inventoryPeptide.num_vials - 1,
          active_vial_status: 'IN_USE',
          active_vial_reconstitution_date: reconstitutionDate,
          active_vial_expiry_date: new Date(
            new Date(reconstitutionDate).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', peptideId);

      if (updateError) throw updateError;

      // Get or create peptide for scheduling
      let peptide = await peptideService.getPeptideById(peptideId);
      
      if (!peptide) {
        // Create peptide if it doesn't exist
        const peptideData: Peptide = {
          id: inventoryPeptide.id,
          name: inventoryPeptide.name,
          strength: `${inventoryPeptide.concentration_per_vial_mcg}mcg/vial`,
          typicalDosageUnits: inventoryPeptide.typical_dose_mcg,
          dosageUnit: 'mcg',
          schedule: { frequency: 'daily', times: ['AM'] }, // Default
          vials: [],
          doseLogs: [],
        };
        
        const { error } = await supabase
          .from('peptides')
          .insert(peptideData);
          
        if (error) throw error;
        peptide = peptideData;
      }

      // Calculate initial amount and create vial
      const initialAmountUnits = inventoryPeptide.concentration_per_vial_mcg / inventoryPeptide.typical_dose_mcg;
      
      const newVial: Vial = {
        id: `${peptideId}_${Date.now()}`,
        isActive: true,
        initialAmountUnits,
        remainingAmountUnits: initialAmountUnits,
        reconstitutionDate,
        expirationDate: new Date(
          new Date(reconstitutionDate).getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        bacWaterMl: inventoryPeptide.bac_water_volume_added || 2,
      };

      // Deactivate other vials and add new one
      const updatedVials = [
        ...(peptide.vials || []).map(v => ({ ...v, isActive: false })),
        newVial,
      ];

      await peptideService.updatePeptide(peptideId, { vials: updatedVials });
      return true;
    } catch (error) {
      console.error('Error activating vial:', error);
      return false;
    }
  },

  /**
   * Delete a peptide from inventory and its associated data from peptides table
   */
  async deletePeptideFromInventory(
    peptideId: string, 
    peptideName: string
  ): Promise<boolean> {
    try {
      // First delete from peptides table (scheduling data)
      const { error: peptidesError } = await supabase
        .from('peptides')
        .delete()
        .eq('id', peptideId);
      
      if (peptidesError) {
        console.error(`Error deleting peptide ${peptideName} from peptides table:`, peptidesError);
        // Continue with deletion from inventory even if peptides deletion fails
      }

      // Then delete from inventory_peptides
      const { error: inventoryError } = await supabase
        .from('inventory_peptides')
        .delete()
        .eq('id', peptideId);

      if (inventoryError) throw inventoryError;

      return true;
    } catch (error) {
      console.error(`Error deleting peptide ${peptideName} from inventory:`, error);
      return false;
    }
  },

  // BAC Water
  async getBacWater(): Promise<InventoryBacWater[]> {
    const { data, error } = await supabase
      .from('inventory_bac_water')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching BAC water:', error);
      return [];
    }

    return data || [];
  },

  // Syringes
  async getSyringes(): Promise<InventorySyringe[]> {
    const { data, error } = await supabase
      .from('inventory_syringes')
      .select('*')
      .order('type_size');

    if (error) {
      console.error('Error fetching syringes:', error);
      return [];
    }

    return data || [];
  },

  // Other Items
  async getOtherItems(): Promise<InventoryOtherItem[]> {
    const { data, error } = await supabase
      .from('inventory_other_items')
      .select('*')
      .order('item_name');

    if (error) {
      console.error('Error fetching other items:', error);
      return [];
    }

    return data || [];
  },
};