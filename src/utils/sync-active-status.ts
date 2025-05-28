/**
 * Sync active vial status between peptides and inventory collections
 * This ensures the active_vial_status field matches the actual vial data
 */

import { Peptide } from '@/types/peptide';
import { InventoryPeptide } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreDbClean } from '@/services/firebase-clean';

/**
 * Determine the correct active_vial_status based on actual vial data
 */
export function determineActiveVialStatus(peptide: Peptide): 'IN_USE' | 'FINISHED' | 'DISCARDED' | 'NONE' {
  if (!peptide.vials || peptide.vials.length === 0) {
    return 'NONE';
  }

  // Find active vial
  const activeVial = peptide.vials.find(v => v.isActive);
  
  if (activeVial) {
    // Check if it has remaining doses
    if (activeVial.remainingAmountUnits > 0) {
      return 'IN_USE';
    } else {
      return 'FINISHED';
    }
  }

  // No active vial - check if any vials are finished
  const hasFinishedVials = peptide.vials.some(v => v.remainingAmountUnits <= 0);
  if (hasFinishedVials) {
    return 'FINISHED';
  }

  return 'NONE';
}

/**
 * Sync the active_vial_status field in inventory based on actual vial data
 */
export async function syncActiveVialStatus(
  peptide: Peptide, 
  inventoryPeptide: InventoryPeptide
): Promise<boolean> {
  try {
    const correctStatus = determineActiveVialStatus(peptide);
    
    // Only update if status is different
    if (inventoryPeptide.active_vial_status !== correctStatus) {
      console.log(`Syncing active_vial_status for ${peptide.name}: ${inventoryPeptide.active_vial_status} -> ${correctStatus}`);
      
      const inventoryRef = doc(firestoreDbClean, 'inventory_peptides', peptide.id);
      await updateDoc(inventoryRef, {
        active_vial_status: correctStatus,
        updated_at: new Date()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error syncing active vial status:', error);
    return false;
  }
}

/**
 * Sync all peptides' active_vial_status fields
 */
export async function syncAllActiveVialStatuses(
  peptides: Peptide[], 
  inventoryPeptides: InventoryPeptide[]
): Promise<number> {
  let updatedCount = 0;
  
  for (const inventoryPeptide of inventoryPeptides) {
    const peptide = peptides.find(p => p.id === inventoryPeptide.id);
    if (peptide) {
      const updated = await syncActiveVialStatus(peptide, inventoryPeptide);
      if (updated) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}