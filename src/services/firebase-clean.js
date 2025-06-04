/**
 * Firebase Clean Implementation
 * 
 * This is a completely fresh implementation of the Firebase service
 * with no dependencies on other Firebase files in the project.
 */
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// DEBUG FLAG - when true, logs all Firestore operations
const DEBUG_FIREBASE = false;

// COLLECTION NAMES - these are the exact collection names in Firestore
const COLLECTION = {
  PEPTIDES: 'peptides',
  INVENTORY_PEPTIDES: 'inventory_peptides',
  INVENTORY_BAC_WATER: 'inventory_bac_water',
  INVENTORY_SYRINGES: 'inventory_syringes',
  INVENTORY_OTHER_ITEMS: 'inventory_other_items'
};

// SUBCOLLECTION NAMES - important for case-sensitivity
const SUBCOLLECTION = {
  VIALS: 'vials',
  DOSE_LOGS: 'doseLogs'  // Note: camelCase is correct based on inspection!
};

// Firebase configuration - copied directly from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyAMnokBM7CVDE265ZLhZROjWrQ5w2DR2P0",
  authDomain: "peptidepal.firebaseapp.com",
  projectId: "peptidepal",
  storageBucket: "peptidepal.appspot.com", 
  messagingSenderId: "229078698562",
  appId: "1:229078698562:web:a3a431131daad253b7fbdb"
};

// Create a fresh Firebase app instance with a unique name
const firebaseAppClean = initializeApp(firebaseConfig, 'peptidepal-clean-instance');

// Get a fresh Firestore instance
const firestoreDbClean = getFirestore(firebaseAppClean);

// Log the initialization
if (DEBUG_FIREBASE) {
  console.log('=== CLEAN FIREBASE INITIALIZED ===');
  console.log(`App name: peptidepal-clean-instance`);
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log('=================================');
}

// Helper to convert Firestore timestamp to ISO string
const timestampToString = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to clean object by removing undefined values
const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Firebase service with properly initialized Firestore references
const firebaseCleanService = {
  // Debug log helper
  _log(operation, path, result) {
    if (DEBUG_FIREBASE) {
      console.log(`[Firebase Clean] ${operation} ${path}: ${result ? 'SUCCESS' : 'FAILED'}`);
    }
  },
  
  async getPeptides() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting all peptides...');
      
      // Explicitly use our clean Firestore instance
      const peptideCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES);
      const peptideSnapshot = await getDocs(peptideCollection);
      
      const peptides = [];
      for (const peptideDoc of peptideSnapshot.docs) {
        const peptideData = peptideDoc.data();
        const peptideId = peptideDoc.id;
        
        // Get vials subcollection
        const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
        const vialsSnapshot = await getDocs(vialsCollection);
        
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection - use camelCase as verified in inspection
        const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
        const doseLogsQuery = query(doseLogsCollection, orderBy("date"));
        const doseLogsSnapshot = await getDocs(doseLogsQuery);
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
        peptides.push({
          id: peptideId,
          name: peptideData.name,
          strength: peptideData.strength,
          dosageUnit: peptideData.dosageUnit,
          typicalDosageUnits: peptideData.typicalDosageUnits,
          schedule: peptideData.schedule,
          notes: peptideData.notes,
          startDate: timestampToString(peptideData.startDate),
          imageUrl: peptideData.imageUrl,
          dataAiHint: peptideData.dataAiHint,
          vials,
          doseLogs
        });
      }
      
      this._log('getPeptides', COLLECTION.PEPTIDES + '/*', true);
      return peptides;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching peptides:', error);
      this._log('getPeptides', COLLECTION.PEPTIDES + '/*', false);
      return [];
    }
  },
  
  async getPeptideById(peptideId) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Getting peptide ${peptideId}...`);
      
      const docRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const peptideData = docSnap.data();
        
        // Get vials subcollection
        const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
        const vialsSnapshot = await getDocs(vialsCollection);
        
        const vials = vialsSnapshot.docs.map(vialDoc => ({
          id: vialDoc.id,
          ...vialDoc.data(),
          reconstitutionDate: timestampToString(vialDoc.data().reconstitutionDate),
          expirationDate: timestampToString(vialDoc.data().expirationDate),
          dateAdded: timestampToString(vialDoc.data().dateAdded)
        }));
        
        // Get doseLogs subcollection - use camelCase as verified in inspection
        const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
        const doseLogsQuery = query(doseLogsCollection, orderBy("date"));
        const doseLogsSnapshot = await getDocs(doseLogsQuery);
        
        const doseLogs = doseLogsSnapshot.docs.map(logDoc => ({
          id: logDoc.id,
          ...logDoc.data(),
          date: timestampToString(logDoc.data().date)
        }));
        
        this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, true);
        return {
          id: docSnap.id,
          name: peptideData.name,
          strength: peptideData.strength,
          dosageUnit: peptideData.dosageUnit,
          typicalDosageUnits: peptideData.typicalDosageUnits,
          schedule: peptideData.schedule,
          notes: peptideData.notes,
          startDate: timestampToString(peptideData.startDate),
          imageUrl: peptideData.imageUrl,
          dataAiHint: peptideData.dataAiHint,
          vials,
          doseLogs
        };
      } else {
        this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, false);
        return null;
      }
    } catch (error) {
      console.error(`[Firebase Clean] Error fetching peptide ${peptideId}:`, error);
      this._log('getPeptideById', `${COLLECTION.PEPTIDES}/${peptideId}`, false);
      return null;
    }
  },
  
  async addDoseLog(peptideId, doseLog) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Adding dose log to peptide ${peptideId}...`);
      console.log(`[Firebase Clean] Dose log data:`, doseLog);
      
      // Get the full peptide document with vials
      const peptide = await this.getPeptideById(peptideId);
      
      if (!peptide) {
        throw new Error(`Peptide ${peptideId} not found`);
      }
      
      // Find the current vial (using isCurrent or falling back to isActive for backward compatibility)
      const activeVial = peptide.vials?.find(v => v.isCurrent || (v.isActive && !peptide.vials.some(vial => vial.isCurrent)));
      if (!activeVial) {
        console.error('[Firebase Clean] No current vial found');
        throw new Error('No current vial found for this peptide. Please set a vial as current before logging doses.');
      }
      
      // Create new dose log with vialId, cleaning out undefined values
      // Don't include an 'id' field - Firebase will generate the document ID
      const newDoseLog = cleanObject({
        ...doseLog,
        vialId: activeVial.id,
        timestamp: serverTimestamp(),
        // Ensure date is stored as string, not as a timestamp
        date: doseLog.date
      });
      
      console.log(`[Firebase Clean] Logging dose: ${doseLog.dosage || doseLog.amount}${doseLog.unit || 'mcg'} for vial ${activeVial.id}`);
      
      // Add the dose log
      const doseLogsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS);
      const doseLogRef = await addDoc(doseLogsCollection, newDoseLog);
      
      // Don't update remainingAmountUnits - it will be calculated from dose logs
      // This prevents sync issues when doses are reverted
      
      // Check if vial should be marked as depleted based on dose logs
      // We'll need to fetch the updated peptide to calculate from logs
      const updatedPeptide = await this.getPeptideById(peptideId);
      if (updatedPeptide) {
        // Import the calculation function
        const { calculateRemainingDoses } = require('../utils/dose-calculations');
        const remainingDoses = calculateRemainingDoses(updatedPeptide);
        
        if (remainingDoses <= 0) {
          console.log(`[Firebase Clean] Vial ${activeVial.id} depleted based on dose logs, updating status`);
          
          // Mark vial as inactive and not current
          const updatedVials = peptide.vials.map(vial => {
            if (vial.id === activeVial.id) {
              return {
                ...vial,
                isActive: false,
                isCurrent: false,
                notes: `${vial.notes || ''}\nDepleted on ${new Date().toLocaleDateString()}`.trim()
              };
            }
            return vial;
          });
          
          // Update the peptide document
          const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
          await updateDoc(peptideRef, {
            vials: updatedVials,
            updatedAt: serverTimestamp()
          });
          
          // Update inventory status
          const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
          await updateDoc(inventoryRef, {
            active_vial_status: 'FINISHED',
            updated_at: serverTimestamp()
          });
        }
      }
      
      this._log('addDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/*`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error adding dose log to peptide ${peptideId}:`, error);
      this._log('addDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/*`, false);
      throw error;
    }
  },

  async getInventoryPeptides() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting inventory peptides...');
      
      const inventoryCollection = collection(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES);
      const inventorySnapshot = await getDocs(inventoryCollection);
      
      const result = inventorySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          num_vials: data.num_vials || 0,
          concentration_per_vial_mcg: data.concentration_per_vial_mcg || 0,
          storage_location: data.storage_location || '',
          expiry_date: timestampToString(data.expiry_date),
          active_vial_status: data.active_vial_status || 'NONE',
          active_vial_reconstitution_date: timestampToString(data.active_vial_reconstitution_date),
          active_vial_expiry_date: timestampToString(data.active_vial_expiry_date),
          low_stock_threshold: data.low_stock_threshold || 2,
          batch_number: data.batch_number || '',
          bac_water_volume_added: data.bac_water_volume_added || 0,
          typical_dose_mcg: data.typical_dose_mcg || 0,
          created_at: timestampToString(data.created_at),
          updated_at: timestampToString(data.updated_at),
        };
      });
      
      this._log('getInventoryPeptides', COLLECTION.INVENTORY_PEPTIDES + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching inventory peptides:', error);
      this._log('getInventoryPeptides', COLLECTION.INVENTORY_PEPTIDES + '/*', false);
      return [];
    }
  },
  
  async getInventoryBacWater() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting bac water inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_BAC_WATER));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventoryBacWater', COLLECTION.INVENTORY_BAC_WATER + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching bac water inventory:', error);
      this._log('getInventoryBacWater', COLLECTION.INVENTORY_BAC_WATER + '/*', false);
      return [];
    }
  },
  
  async getInventorySyringes() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting syringes inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_SYRINGES));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventorySyringes', COLLECTION.INVENTORY_SYRINGES + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching syringes inventory:', error);
      this._log('getInventorySyringes', COLLECTION.INVENTORY_SYRINGES + '/*', false);
      return [];
    }
  },
  
  async getInventoryOtherItems() {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Getting other items inventory...');
      
      const snapshot = await getDocs(collection(firestoreDbClean, COLLECTION.INVENTORY_OTHER_ITEMS));
      
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiry_date: timestampToString(doc.data().expiry_date),
        created_at: timestampToString(doc.data().created_at),
        updated_at: timestampToString(doc.data().updated_at),
      }));
      
      this._log('getInventoryOtherItems', COLLECTION.INVENTORY_OTHER_ITEMS + '/*', true);
      return result;
    } catch (error) {
      console.error('[Firebase Clean] Error fetching other items inventory:', error);
      this._log('getInventoryOtherItems', COLLECTION.INVENTORY_OTHER_ITEMS + '/*', false);
      return [];
    }
  },
  
  async updatePeptide(peptideId, updates) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Updating peptide ${peptideId}...`);
      
      const peptideRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      await updateDoc(peptideRef, cleanObject({
        ...updates,
        updatedAt: serverTimestamp()
      }));
      
      this._log('updatePeptide', `${COLLECTION.PEPTIDES}/${peptideId}`, true);
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error updating peptide ${peptideId}:`, error);
      this._log('updatePeptide', `${COLLECTION.PEPTIDES}/${peptideId}`, false);
      throw error;
    }
  },
  
  async activateVial(peptideId, vialId) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Activating vial ${vialId} for peptide ${peptideId}...`);
      
      // Get all vials for this peptide
      const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
      const vialsSnapshot = await getDocs(vialsCollection);
      
      // Update all vials - deactivate all except the selected one
      const updatePromises = vialsSnapshot.docs.map(vialDoc => {
        const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialDoc.id);
        return updateDoc(vialRef, {
          isActive: vialDoc.id === vialId,
          isCurrent: vialDoc.id === vialId
        });
      });
      
      await Promise.all(updatePromises);
      
      this._log('activateVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error activating vial ${vialId}:`, error);
      this._log('activateVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  },
  
  async addPeptideToInventory(inventoryData, scheduleData) {
    try {
      if (DEBUG_FIREBASE) console.log('[Firebase Clean] Adding peptide to inventory...');
      
      // Generate a unique ID for both inventory and peptide entries
      const peptideId = doc(collection(firestoreDbClean, 'temp')).id;
      
      // Create inventory entry - clean undefined values
      const inventoryDocRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      await setDoc(inventoryDocRef, cleanObject({
        ...inventoryData,
        id: peptideId,
        low_stock_threshold: inventoryData.low_stock_threshold || 2, // Default to 2 if undefined
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }));
      
      // Create corresponding peptide entry for scheduling
      const peptideDocRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
      await setDoc(peptideDocRef, cleanObject({
        id: peptideId,
        name: inventoryData.name,
        strength: scheduleData.strength || '',
        typicalDosageUnits: scheduleData.typicalDosageUnits,
        dosageUnit: scheduleData.dosageUnit || 'mcg',
        schedule: scheduleData.schedule ? cleanObject(scheduleData.schedule) : {}, // Clean nested object
        startDate: scheduleData.startDate || null,
        notes: scheduleData.notes || '',
        dataAiHint: scheduleData.dataAiHint || '',
        imageUrl: null,
        // Store initial doses info for future vial activation
        initialDosesPerVial: inventoryData.initial_doses_per_vial || 
          Math.floor(inventoryData.concentration_per_vial_mcg / inventoryData.typical_dose_mcg)
      }));
      
      // Create an empty vials subcollection
      const vialsCollection = collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS);
      // No need to create empty collection, it will be created when first vial is added
      
      this._log('addPeptideToInventory', `${COLLECTION.INVENTORY_PEPTIDES}/${peptideId}`, true);
      this._log('addPeptideToInventory', `${COLLECTION.PEPTIDES}/${peptideId}`, true);
      
      return true;
    } catch (error) {
      console.error('[Firebase Clean] Error adding peptide to inventory:', error);
      this._log('addPeptideToInventory', `inventory/peptide creation`, false);
      throw error;
    }
  },
  
  async updatePeptideInInventory(peptideId, inventoryUpdates, scheduleUpdates) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Updating inventory peptide ${peptideId}...`);
      
      // Update inventory entry - clean undefined values
      const inventoryDocRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      await updateDoc(inventoryDocRef, cleanObject({
        ...inventoryUpdates,
        updated_at: serverTimestamp()
      }));
      
      // Update peptide if schedule updates provided
      if (scheduleUpdates) {
        const peptideDocRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId);
        await updateDoc(peptideDocRef, cleanObject(scheduleUpdates));
      }
      
      this._log('updatePeptideInInventory', `${COLLECTION.INVENTORY_PEPTIDES}/${peptideId}`, true);
      return true;
    } catch (error) {
      console.error(`[Firebase Clean] Error updating inventory peptide ${peptideId}:`, error);
      this._log('updatePeptideInInventory', `${COLLECTION.INVENTORY_PEPTIDES}/${peptideId}`, false);
      throw error;
    }
  },
  
  async removeDoseLog(peptideId, doseLogId) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Removing dose log ${doseLogId} from peptide ${peptideId}...`);
      
      // Get the dose log to find the vialId
      const doseLogRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS, doseLogId);
      const doseLogSnap = await getDoc(doseLogRef);
      
      if (!doseLogSnap.exists()) {
        throw new Error(`Dose log ${doseLogId} not found`);
      }
      
      const doseLogData = doseLogSnap.data();
      console.log(`[Firebase Clean] Removing dose log:`, doseLogData);
      
      // Simply delete the dose log without updating remainingAmountUnits
      // The remaining doses will be calculated from the dose logs
      await deleteDoc(doseLogRef);
      
      this._log('removeDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/${doseLogId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error removing dose log ${doseLogId}:`, error);
      this._log('removeDoseLog', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.DOSE_LOGS}/${doseLogId}`, false);
      throw error;
    }
  },

  async updateVial(peptideId, vialId, updates) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Updating vial ${vialId} for peptide ${peptideId}...`);
      
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      await updateDoc(vialRef, cleanObject(updates));
      
      this._log('updateVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error updating vial ${vialId}:`, error);
      this._log('updateVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  },

  async deleteVial(peptideId, vialId) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Deleting vial ${vialId} from peptide ${peptideId}...`);
      
      // Get the vial first to check if it's active
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      const vialSnap = await getDoc(vialRef);
      
      if (!vialSnap.exists()) {
        throw new Error(`Vial ${vialId} not found`);
      }
      
      const vialData = vialSnap.data();
      if (vialData.isActive) {
        throw new Error('Cannot delete an active vial');
      }
      
      // Delete all dose logs associated with this vial
      const doseLogsQuery = query(
        collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS),
        where('vialId', '==', vialId)
      );
      const doseLogsSnapshot = await getDocs(doseLogsQuery);
      
      // Delete each dose log
      for (const doseLogDoc of doseLogsSnapshot.docs) {
        await deleteDoc(doseLogDoc.ref);
      }
      
      // Delete the vial
      await deleteDoc(vialRef);
      
      // If this vial was activated from inventory, increment the stock back
      const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
      const inventorySnap = await getDoc(inventoryRef);
      if (inventorySnap.exists()) {
        const inventoryData = inventorySnap.data();
        await updateDoc(inventoryRef, {
          num_vials: inventoryData.num_vials + 1,
          updated_at: serverTimestamp()
        });
      }
      
      this._log('deleteVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error deleting vial ${vialId}:`, error);
      this._log('deleteVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  },

  async recalculateVialDoses(peptideId, vialId, newTotalMcg, newBacWaterMl, typicalDoseMcg) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Recalculating doses for vial ${vialId}...`);
      
      // Calculate new initial doses based on new total mcg and typical dose
      const newInitialDoses = Math.floor(newTotalMcg / typicalDoseMcg);
      
      // Get current dose logs count for this vial
      const doseLogsQuery = query(
        collection(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.DOSE_LOGS),
        where('vialId', '==', vialId)
      );
      const doseLogsSnapshot = await getDocs(doseLogsQuery);
      const dosesUsed = doseLogsSnapshot.size;
      const remainingDoses = Math.max(0, newInitialDoses - dosesUsed);
      
      // Update the vial with new values
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      await updateDoc(vialRef, {
        totalPeptideInVialMcg: newTotalMcg,
        reconstitutionBacWaterMl: newBacWaterMl,
        initialAmountUnits: newInitialDoses,
        remainingAmountUnits: remainingDoses,
        notes: `Recalculated: ${newTotalMcg}mcg in ${newBacWaterMl}mL = ${newInitialDoses} doses`
      });
      
      this._log('recalculateVialDoses', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error recalculating vial doses:`, error);
      this._log('recalculateVialDoses', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  },

  async discardVial(peptideId, vialId, reason) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Discarding vial ${vialId} for peptide ${peptideId}...`);
      
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      const vialSnap = await getDoc(vialRef);
      
      if (!vialSnap.exists()) {
        throw new Error(`Vial ${vialId} not found`);
      }
      
      const vialData = vialSnap.data();
      const discardDate = new Date().toISOString();
      const discardNote = `Discarded on ${new Date(discardDate).toLocaleDateString()} - Reason: ${reason}`;
      
      // Update the vial to mark it as discarded
      await updateDoc(vialRef, {
        isActive: false,
        isCurrent: false,
        remainingAmountUnits: 0,
        discardedAt: discardDate,
        discardReason: reason,
        notes: vialData.notes ? `${vialData.notes} | ${discardNote}` : discardNote
      });
      
      // Update inventory if this was the current vial
      if (vialData.isCurrent || vialData.isActive) {
        const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
        const inventorySnap = await getDoc(inventoryRef);
        if (inventorySnap.exists()) {
          await updateDoc(inventoryRef, {
            active_vial_status: 'NONE',
            active_vial_reconstitution_date: null,
            active_vial_expiry_date: null,
            updated_at: serverTimestamp()
          });
        }
      }
      
      this._log('discardVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error discarding vial ${vialId}:`, error);
      this._log('discardVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  },
  
  async completeVial(peptideId, vialId, completionType, remainingDoses, reason) {
    try {
      if (DEBUG_FIREBASE) console.log(`[Firebase Clean] Completing vial ${vialId} for peptide ${peptideId}...`);
      
      const vialRef = doc(firestoreDbClean, COLLECTION.PEPTIDES, peptideId, SUBCOLLECTION.VIALS, vialId);
      const vialSnap = await getDoc(vialRef);
      
      if (!vialSnap.exists()) {
        throw new Error(`Vial ${vialId} not found`);
      }
      
      const vialData = vialSnap.data();
      const completedAt = new Date().toISOString();
      const completionNote = `Completed on ${new Date(completedAt).toLocaleDateString()} - Type: ${completionType}${reason ? ` - ${reason}` : ''}`;
      
      // Calculate wasted doses (0 if fully used or transferred)
      const wastedDoses = (completionType === 'fully_used' || completionType === 'transferred') ? 0 : remainingDoses;
      
      // Create completion data
      const completion = {
        type: completionType,
        remainingDoses: remainingDoses,
        wastedDoses: wastedDoses,
        completedAt: completedAt,
        ...(reason && { reason })
      };
      
      // Update the vial to mark it as completed
      await updateDoc(vialRef, {
        isActive: false,
        isCurrent: false,
        completion: completion,
        notes: vialData.notes ? `${vialData.notes} | ${completionNote}` : completionNote
      });
      
      // Update inventory if this was the current vial
      if (vialData.isCurrent || vialData.isActive) {
        const inventoryRef = doc(firestoreDbClean, COLLECTION.INVENTORY_PEPTIDES, peptideId);
        const inventorySnap = await getDoc(inventoryRef);
        if (inventorySnap.exists()) {
          const newStatus = completionType === 'fully_used' ? 'FINISHED' : 'NONE';
          await updateDoc(inventoryRef, {
            active_vial_status: newStatus,
            active_vial_reconstitution_date: null,
            active_vial_expiry_date: null,
            updated_at: serverTimestamp()
          });
        }
      }
      
      this._log('completeVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, true);
      
      // Return the updated peptide
      return await this.getPeptideById(peptideId);
    } catch (error) {
      console.error(`[Firebase Clean] Error completing vial ${vialId}:`, error);
      this._log('completeVial', `${COLLECTION.PEPTIDES}/${peptideId}/${SUBCOLLECTION.VIALS}/${vialId}`, false);
      throw error;
    }
  }
};

// Export clean Firebase instances
export { firebaseAppClean, firestoreDbClean, firebaseCleanService };

// Export default clean service
export default firebaseCleanService;