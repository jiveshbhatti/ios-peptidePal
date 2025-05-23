/**
 * Vial Management Utilities
 * 
 * Handles vial lifecycle management including:
 * - Depletion tracking
 * - Expiration checking
 * - Status updates
 * - Automatic deactivation
 */

import { Peptide, Vial } from '@/types/peptide';
import { InventoryPeptide } from '@/types/inventory';

export interface VialStatus {
  isExpired: boolean;
  isEmpty: boolean;
  isActive: boolean;
  canUse: boolean;
  daysUntilExpiry?: number;
  remainingDoses: number;
}

/**
 * Check vial status including expiration and depletion
 */
export function getVialStatus(vial: Vial): VialStatus {
  const now = new Date();
  const expirationDate = vial.expirationDate ? new Date(vial.expirationDate) : null;
  
  const isExpired = expirationDate ? expirationDate < now : false;
  const isEmpty = vial.remainingAmountUnits <= 0;
  const isActive = vial.isActive;
  const canUse = isActive && !isExpired && !isEmpty;
  
  const daysUntilExpiry = expirationDate 
    ? Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  return {
    isExpired,
    isEmpty,
    isActive,
    canUse,
    daysUntilExpiry,
    remainingDoses: vial.remainingAmountUnits
  };
}

/**
 * Get the best available vial for use
 * Returns active vial if usable, otherwise finds best alternative
 */
export function getBestAvailableVial(vials: Vial[]): Vial | null {
  if (!vials || vials.length === 0) return null;
  
  // First check for active vial
  const activeVial = vials.find(v => v.isActive);
  if (activeVial) {
    const status = getVialStatus(activeVial);
    if (status.canUse) {
      return activeVial;
    }
  }
  
  // Find best alternative vial
  const usableVials = vials
    .filter(v => {
      const status = getVialStatus(v);
      return !status.isExpired && !status.isEmpty;
    })
    .sort((a, b) => {
      // Sort by date added (newest first)
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });
  
  return usableVials[0] || null;
}

/**
 * Create updated vial after dose logging
 */
export function updateVialAfterDose(vial: Vial, dosesUsed: number = 1): Vial {
  const newRemainingDoses = Math.max(0, vial.remainingAmountUnits - dosesUsed);
  const isEmpty = newRemainingDoses <= 0;
  
  const updatedVial: Vial = {
    ...vial,
    remainingAmountUnits: newRemainingDoses,
    isActive: isEmpty ? false : vial.isActive,
    notes: isEmpty 
      ? `${vial.notes || ''}\nDepleted on ${new Date().toLocaleDateString()}`.trim()
      : vial.notes
  };
  
  return updatedVial;
}

/**
 * Determine if we should prompt for new vial activation
 */
export function shouldPromptForNewVial(
  peptide: Peptide, 
  inventoryPeptide?: InventoryPeptide
): boolean {
  const activeVial = peptide.vials?.find(v => v.isActive);
  
  // No active vial
  if (!activeVial) return true;
  
  // Active vial is not usable
  const status = getVialStatus(activeVial);
  if (!status.canUse) return true;
  
  // Low on doses (less than 3 remaining)
  if (status.remainingDoses < 3 && inventoryPeptide && inventoryPeptide.num_vials > 0) {
    return true;
  }
  
  return false;
}

/**
 * Get inventory status based on vial state
 */
export function getInventoryStatusFromVial(vial: Vial): 'IN_USE' | 'FINISHED' | 'DISCARDED' | 'NONE' {
  const status = getVialStatus(vial);
  
  if (vial.isActive && status.canUse) {
    return 'IN_USE';
  }
  
  if (status.isEmpty) {
    return 'FINISHED';
  }
  
  if (status.isExpired) {
    return 'DISCARDED';
  }
  
  return 'NONE';
}

/**
 * Calculate expiration date for a new vial (28 days from reconstitution)
 */
export function calculateVialExpirationDate(reconstitutionDate: Date | string): string {
  const date = typeof reconstitutionDate === 'string' ? new Date(reconstitutionDate) : reconstitutionDate;
  const expirationDate = new Date(date);
  expirationDate.setDate(expirationDate.getDate() + 28);
  return expirationDate.toISOString();
}