import { InventoryPeptide, InventoryBacWater, InventorySyringe, InventoryOtherItem } from '@/types/inventory';
import { Peptide, Vial } from '@/types/peptide';
import { generateUUID } from '@/utils/uuid';
import firebaseCleanService, { firestoreDbClean } from './firebase-clean';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

// Collection names
const COLLECTION = {
  PEPTIDES: 'peptides',
  INVENTORY_PEPTIDES: 'inventory_peptides',
  INVENTORY_BAC_WATER: 'inventory_bac_water',
  INVENTORY_SYRINGES: 'inventory_syringes',
  INVENTORY_OTHER_ITEMS: 'inventory_other_items'
};

const SUBCOLLECTION = {
  VIALS: 'vials'
};

export const inventoryService = {
  // Update inventory peptide with usage tracking information
  async updatePeptideUsage(peptideId: string, usedDoses: number): Promise<boolean> {
    try {
      // Update the batch_number field with usage information
      const peptideRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      await updateDoc(peptideRef, { 
        batch_number: `USAGE:${usedDoses}`,
        updated_at: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating peptide usage tracking:', error);
      return false;
    }
  },
  
  // Peptide Inventory
  async getInventoryPeptides(): Promise<InventoryPeptide[]> {
    try {
      return await firebaseCleanService.getInventoryPeptides();
    } catch (error) {
      console.error('Error fetching inventory peptides:', error);
      return [];
    }
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
      initialDosesPerVial?: number; // New field
    }
  ): Promise<boolean> {
    try {
      // Generate a unique ID for both inventory and peptide entries
      const peptideId = generateUUID();
      
      // Create inventory entry with explicit ID
      const inventoryPeptideData = {
        ...inventoryData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        initial_doses_per_vial: scheduleData.initialDosesPerVial || Math.floor(inventoryData.concentration_per_vial_mcg / inventoryData.typical_dose_mcg)
      };
      
      const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      await setDoc(inventoryRef, inventoryPeptideData);

      // Create corresponding peptide entry for scheduling
      const peptideData = {
        name: inventoryData.name,
        strength: scheduleData.strength,
        typicalDosageUnits: scheduleData.typicalDosageUnits,
        dosageUnit: scheduleData.dosageUnit,
        schedule: scheduleData.schedule,
        startDate: scheduleData.startDate || new Date().toISOString(),
        notes: scheduleData.notes || '',
        dataAiHint: scheduleData.dataAiHint || '',
        imageUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      await setDoc(peptideRef, peptideData);

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
      const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, id);
      await updateDoc(inventoryRef, {
        ...inventoryUpdates,
        updated_at: serverTimestamp()
      });

      // Update peptide if schedule updates provided
      if (scheduleUpdates) {
        await firebaseCleanService.updatePeptide(id, scheduleUpdates);
      }

      return true;
    } catch (error) {
      console.error('Error updating inventory peptide:', error);
      return false;
    }
  },

  async activatePeptideVial(
    peptideId: string,
    reconstitutionDate: string,
    bacWaterAmount?: number,
    setAsCurrent: boolean = true
  ): Promise<boolean> {
    try {
      // Get inventory peptide
      const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      const inventorySnap = await getDoc(inventoryRef);
      
      if (!inventorySnap.exists()) {
        throw new Error('Inventory peptide not found');
      }
      
      const inventoryPeptide = { id: inventorySnap.id, ...inventorySnap.data() } as any;

      // Update inventory (decrement vials, set active status, store BAC water amount)
      await updateDoc(inventoryRef, {
        num_vials: inventoryPeptide.num_vials - 1,
        active_vial_status: 'IN_USE',
        active_vial_reconstitution_date: reconstitutionDate,
        active_vial_expiry_date: new Date(
          new Date(reconstitutionDate).getTime() + 35 * 24 * 60 * 60 * 1000 // 5 weeks = 35 days
        ).toISOString(),
        bac_water_volume_added: bacWaterAmount || inventoryPeptide.bac_water_volume_added || 2,
        updated_at: serverTimestamp()
      });

      // Get or create peptide for scheduling
      let peptide = await firebaseCleanService.getPeptideById(peptideId);
      
      if (!peptide) {
        // Create peptide if it doesn't exist
        const peptideData = {
          name: inventoryPeptide.name,
          strength: `${inventoryPeptide.concentration_per_vial_mcg}mcg/vial`,
          typicalDosageUnits: inventoryPeptide.typical_dose_mcg,
          dosageUnit: 'mcg',
          schedule: { frequency: 'daily', times: ['AM'] }, // Default
          startDate: new Date().toISOString(),
          notes: '',
          imageUrl: '',
          dataAiHint: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
        await setDoc(peptideRef, peptideData);
      }

      // Use initial doses per vial if available, otherwise calculate
      const initialAmountUnits = inventoryPeptide.initial_doses_per_vial || 
        Math.floor(inventoryPeptide.concentration_per_vial_mcg / inventoryPeptide.typical_dose_mcg);
      
      const vialId = `${peptideId}_${Date.now()}`;
      const newVial = {
        id: vialId,
        isActive: setAsCurrent, // For backward compatibility
        isCurrent: setAsCurrent, // New field - true if this should be the current vial
        isReconstituted: true, // Always true for newly activated vials
        initialAmountUnits,
        remainingAmountUnits: initialAmountUnits,
        reconstitutionDate,
        expirationDate: new Date(
          new Date(reconstitutionDate).getTime() + 35 * 24 * 60 * 60 * 1000 // 5 weeks = 35 days
        ).toISOString(),
        reconstitutionBacWaterMl: bacWaterAmount || inventoryPeptide.bac_water_volume_added || 2,
        totalPeptideInVialMcg: inventoryPeptide.concentration_per_vial_mcg || 0,
        dateAdded: new Date().toISOString(),
        notes: `Activated with ${bacWaterAmount || inventoryPeptide.bac_water_volume_added || 2}mL BAC water. Stock before activation: ${inventoryPeptide.num_vials + 1} vials.`
      };

      // If setting as current, deactivate all other current vials
      if (setAsCurrent) {
        const existingPeptide = await firebaseCleanService.getPeptideById(peptideId);
        if (existingPeptide && existingPeptide.vials) {
          for (const vial of existingPeptide.vials) {
            const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vial.id);
            await updateDoc(vialRef, { 
              isActive: false, 
              isCurrent: false 
            });
          }
        }
      }

      // Add new vial
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      await setDoc(vialRef, newVial);
      
      // Initialize usage tracking in batch_number field (0 doses used initially)
      await this.updatePeptideUsage(peptideId, 0);
      
      return true;
    } catch (error) {
      console.error('Error activating vial:', error);
      return false;
    }
  },

  /**
   * Set a specific vial as the current active vial
   */
  async setVialAsCurrent(peptideId: string, vialId: string): Promise<boolean> {
    try {
      // First deactivate all vials for this peptide
      const existingPeptide = await firebaseCleanService.getPeptideById(peptideId);
      if (existingPeptide && existingPeptide.vials) {
        for (const vial of existingPeptide.vials) {
          const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vial.id);
          await updateDoc(vialRef, { 
            isActive: false, 
            isCurrent: false 
          });
        }
      }
      
      // Set the selected vial as current
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      await updateDoc(vialRef, { 
        isActive: true, 
        isCurrent: true 
      });
      
      return true;
    } catch (error) {
      console.error('Error setting vial as current:', error);
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
      // First delete from peptides collection (scheduling data)
      const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      await deleteDoc(peptideRef);

      // Then delete from inventory_peptides
      const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      await deleteDoc(inventoryRef);

      return true;
    } catch (error) {
      console.error(`Error deleting peptide ${peptideName} from inventory:`, error);
      return false;
    }
  },

  // BAC Water
  async getBacWater(): Promise<InventoryBacWater[]> {
    try {
      return await firebaseCleanService.getInventoryBacWater();
    } catch (error) {
      console.error('Error fetching BAC water:', error);
      return [];
    }
  },

  // Syringes
  async getSyringes(): Promise<InventorySyringe[]> {
    try {
      return await firebaseCleanService.getInventorySyringes();
    } catch (error) {
      console.error('Error fetching syringes:', error);
      return [];
    }
  },

  // Other Items
  async getOtherItems(): Promise<InventoryOtherItem[]> {
    try {
      return await firebaseCleanService.getInventoryOtherItems();
    } catch (error) {
      console.error('Error fetching other items:', error);
      return [];
    }
  },
};