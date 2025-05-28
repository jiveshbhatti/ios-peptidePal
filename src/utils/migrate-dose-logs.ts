/**
 * Migration utility to associate existing dose logs with their vials
 * This fixes the issue where dose logs created before vialId was added
 * don't show up in vial usage counts
 */

import { Peptide, DoseLog, Vial } from '@/types/peptide';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { firestoreDbClean } from '@/services/firebase-clean';

/**
 * Determine which vial a dose log belongs to based on the date
 */
function findVialForDoseLog(doseLogs: DoseLog, vials: Vial[]): string | null {
  const logDate = new Date(doseLogs.date);
  
  // Sort vials by dateAdded (oldest first)
  const sortedVials = [...vials].sort((a, b) => 
    new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );
  
  // Find the vial that was active when this dose was logged
  for (let i = 0; i < sortedVials.length; i++) {
    const vial = sortedVials[i];
    const vialStartDate = new Date(vial.dateAdded);
    
    // Check if this vial was started before the dose log
    if (vialStartDate <= logDate) {
      // Check if there's a next vial
      if (i + 1 < sortedVials.length) {
        const nextVial = sortedVials[i + 1];
        const nextVialStartDate = new Date(nextVial.dateAdded);
        
        // If the dose was logged before the next vial started, it belongs to this vial
        if (logDate < nextVialStartDate) {
          return vial.id;
        }
      } else {
        // This is the last vial, so the dose must belong to it
        return vial.id;
      }
    }
  }
  
  // If no vial was found (shouldn't happen), return the first vial
  return sortedVials[0]?.id || null;
}

/**
 * Migrate dose logs for a single peptide
 */
export async function migrateDoseLogsForPeptide(peptide: Peptide): Promise<number> {
  if (!peptide.doseLogs || peptide.doseLogs.length === 0) {
    return 0;
  }
  
  if (!peptide.vials || peptide.vials.length === 0) {
    console.warn(`No vials found for ${peptide.name}, skipping migration`);
    return 0;
  }
  
  let migratedCount = 0;
  const batch = writeBatch(firestoreDbClean);
  
  for (const doseLog of peptide.doseLogs) {
    // Skip if already has vialId
    if (doseLog.vialId) {
      continue;
    }
    
    const vialId = findVialForDoseLog(doseLog, peptide.vials);
    if (vialId) {
      // Update the dose log with the vialId
      const doseLogRef = doc(
        firestoreDbClean, 
        'peptides', 
        peptide.id, 
        'doseLogs', 
        doseLog.id
      );
      
      batch.update(doseLogRef, { vialId });
      migratedCount++;
      
      console.log(`Migrating dose log ${doseLog.id} for ${peptide.name} to vial ${vialId}`);
    }
  }
  
  if (migratedCount > 0) {
    await batch.commit();
    console.log(`Migrated ${migratedCount} dose logs for ${peptide.name}`);
  }
  
  return migratedCount;
}

/**
 * Migrate all dose logs for all peptides
 */
export async function migrateAllDoseLogs(peptides: Peptide[]): Promise<void> {
  console.log('Starting dose log migration...');
  
  let totalMigrated = 0;
  
  for (const peptide of peptides) {
    const migrated = await migrateDoseLogsForPeptide(peptide);
    totalMigrated += migrated;
  }
  
  console.log(`Migration complete. Total dose logs migrated: ${totalMigrated}`);
}

/**
 * Check if migration is needed
 */
export function needsDoseLogMigration(peptides: Peptide[]): boolean {
  for (const peptide of peptides) {
    if (peptide.doseLogs) {
      for (const doseLog of peptide.doseLogs) {
        if (!doseLog.vialId) {
          return true;
        }
      }
    }
  }
  return false;
}